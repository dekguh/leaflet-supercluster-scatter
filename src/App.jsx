/* eslint-disable no-unused-vars */
import React from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import Supercluster from 'supercluster'
import { dataEvidences } from './constants'
import * as ReactDOMServer from 'react-dom/server'
import './App.css'

const updateMapBoundsAndZoom = (mapContext, setBounds, setZoom) => {
  if (mapContext) {
    const bounds = mapContext.getBounds()
      
    setBounds([
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat
    ])
      
    setZoom(mapContext.getZoom())
  }
}

function App() {
  const geojsonRef = React.useRef(null)
  const superclusterRef = React.useRef(null)

  const [mapContext, setMapContext] = React.useState(null)
  const [mapBounds, setMapBounds] = React.useState(null)
  const [mapZoom, setMapZoom] = React.useState(14)

  const createClusterIcon = (feature, latlong) => {
    if(!feature.properties.cluster) {
      // EVIDENCE MARKER
      return L.marker([latlong.lat, latlong.lng], {
        icon: L.divIcon({
          className: 'icon-marker',
          html: ReactDOMServer.renderToString(
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#724603B2',
              borderRadius: '50%'
            }}></div>
          ),
          iconSize: [20, 20]
        })
      })
    } else {
      const calculateSize = 24 + (feature.properties.point_count * 4)
      // CLUSTER MARKER
      return L.marker([latlong.lat, latlong.lng], {
        icon: L.divIcon({
          className: 'icon-marker',
          html: ReactDOMServer.renderToString(
            <div style={{
              width: `${calculateSize}px`,
              height: `${calculateSize}px`,
              backgroundColor: '#EF6C00CC',
              borderRadius: '50%',
            }}>
              <div style={{ position: 'relative' }}>
                <div
                  className='circle'
                  style={{
                    width: `${calculateSize}px`,
                    height: `${calculateSize}px`,
                    animationDelay: '0s',
                  }}
                ></div>
                <div
                  className='circle'
                  style={{
                    width: `${calculateSize}px`,
                    height: `${calculateSize}px`,
                    animationDelay: '0.8s',
                  }}
                ></div>
                <div
                  className='circle'
                  style={{
                    width: `${calculateSize}px`,
                    height: `${calculateSize}px`,
                    animationDelay: '1.6s',
                  }}
                ></div>

                <div
                  className='circle'
                  style={{
                    width: `${calculateSize}px`,
                    height: `${calculateSize}px`,
                    animationDelay: '2.4s',
                  }}
                ></div>
              </div>
            </div>
          ),
          iconSize: [calculateSize, calculateSize]
        })
      })
    }
  }

  const updateCluster = () => {
    // CREATE GEOJSON & ADD TO MAP
    if(!geojsonRef.current) {
      geojsonRef.current = L.geoJSON(null, {
        pointToLayer: createClusterIcon
      }).addTo(mapContext)
    }

    // CLEAR PREV LAYERS
    geojsonRef.current?.clearLayers()

    // RESTRUCTURE TO GEOJSON
    const pointList = dataEvidences.map(item => ({
      type: 'Feature',
      properties: {
        cluster: false,
      },
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(item.coordinat[1]),
          parseFloat(item.coordinat[0]),
        ],
      },
      markerData: item,
    }))

    // CREATE INSTANCE SUPERCLUSTER
    superclusterRef.current = new Supercluster({
      radius: 1000,
      extent: 128,
      maxZoom: 20,
      minZoom: 20,
    })

    // ADD POINT
    superclusterRef.current.load(pointList)

    // GET MARKERS INSIDE BOUNDS (ENTIRE SCREEN)
    const newClusterList = superclusterRef.current.getClusters(mapBounds, mapZoom)

    // ADD DATA CLUSTER LIST TO GEOJSON
    geojsonRef.current.addData(newClusterList)
  }

  // UPDATE ZOOM & BOUNDS
  React.useEffect(() => {
    if(mapContext) {
      console.log('called')
      if(!mapBounds || !mapZoom) {
        updateMapBoundsAndZoom(mapContext, setMapBounds, setMapZoom)
      }
  
      mapContext.on('zoomend dragend', () => {
        updateMapBoundsAndZoom(mapContext, setMapBounds, setMapZoom)
      })
    }
  }, [mapContext])

  // UPDATE CLUSTER
  React.useEffect(() => {
    if(mapBounds && mapZoom) {
      updateCluster()
    }
  }, [mapBounds, mapZoom])

  return (
    <MapContainer
      style={{ height: '700px', width: '100%' }}
      center={[-8.793272, 115.215602]}
      zoom={12}
      scrollWheelZoom
      whenReady={current => setMapContext(current.target)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}

export default App
