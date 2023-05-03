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
  const geojsonRef = React.useRef({})
  const superclusterRef = React.useRef({})

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
              position: 'relative',
            }}>
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
                  animationDelay: '1s',
                }}
              ></div>
              <div
                className='circle'
                style={{
                  width: `${calculateSize}px`,
                  height: `${calculateSize}px`,
                  animationDelay: '2s',
                }}
              ></div>
            </div>
          ),
          iconSize: [calculateSize, calculateSize]
        })
      })
    }
  }

  const updateCluster = () => {
    let pointListFiltered = {}
    const listUniqueDevices = [...new Set(dataEvidences.map(item => item.device))]

    // CREATE GEOJSON & ADD TO MAP
    if(Object.keys(geojsonRef.current).length === 0) {
      listUniqueDevices.forEach(item => {
        geojsonRef.current[item] = L.geoJSON(null, {
          pointToLayer: createClusterIcon
        }).addTo(mapContext)
      })
    }

    // CLEAR PREV LAYERS
    listUniqueDevices.forEach(item => {
      geojsonRef.current[item]?.clearLayers()
    })

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

    listUniqueDevices.forEach(deviceName => {
      // FILTERING EVIDENCES BY DEVICE
      pointListFiltered[deviceName] = pointList.filter(item => item.markerData.device === deviceName)

      // CREATE INSTANCE SUPERCLUSTER
      superclusterRef.current[deviceName] = new Supercluster({
        radius: 0.4,
        extent: 24,
        maxZoom: 20,
      })

      // ADD POINT
      superclusterRef.current[deviceName].load(pointListFiltered[deviceName])

      // GET MARKERS INSIDE BOUNDS (ENTIRE SCREEN)
      const newClusterList = superclusterRef.current[deviceName].getClusters(mapBounds, mapZoom)

      // ADD DATA CLUSTER LIST TO GEOJSON
      geojsonRef.current[deviceName].addData(newClusterList)
    })
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
