'use strict'
/* mesaure */
L.Control.Measure = L.Control.extend({
  options: {
    isMeasure: false,
    line: {
      color: '#2C92F6',
      weight: 2,
      interactive: false,
      dashArray: '8,8'
    }
  },
  initialize: function (options) {
    L.setOptions(this, options)
  },
  onAdd: function (map) {
    this._map = map
    this._measureLayers = L.layerGroup([]).addTo(map)
    this._initOptions()
    this._initLayout()
    return this._container
  },
  onRemove: function () {
    this.removeMeasureEvent()
  },
  _initLayout () {
    this._container = L.DomUtil.create('div', `leaflet-bar`)
  },
  _initOptions () {
    this._key = 1
    this._curMesure = false
    this._keyInx = 0
    this._latlngs = {}
  },
  disableMeasure () {
    this._map._container.style.cursor = ''
    this.options.isMeasure = false
    this.removeMeasureEvent()
  },
  clearMeasure () {
    this.disableMeasure()
    this._initOptions()
    this._measureLayers.clearLayers()
  },
  enableMeasure () {
    this._map._container.style.cursor = 'crosshair'
    this.options.isMeasure = true
    if (this.options.isMeasure) {
      this._map.doubleClickZoom.disable()
      this._map.on('click', this._measureClick, this)
      this._map.on('dblclick', this._measureDbClick, this)
    }
  },
  removeMeasureEvent () {
    this._map.off('click', this._measureClick, this)
    this._map.off('dblclick', this._measureDbClick, this)
    this._map.off('mousemove', this._measureMouseMove, this)
    this._map.doubleClickZoom.enable()
  },
  _measureClick (e) {
    clearTimeout(this.maptimer)
    this.maptimer = setTimeout(() => {
      // console.log('measureClick')
      this._curMesure = true

      let curlatlngs = this._latlngs[this._key]

      if (curlatlngs && curlatlngs.length > 0) {
        let lastLatlngs = curlatlngs[curlatlngs.length - 1]

        curlatlngs.push(e.latlng)
        this._currentMeasureLine.setLatLngs(curlatlngs)

        let _distance = this._getDistance(lastLatlngs, e.latlng)
        this._keyInx += 1
        let marker = L.marker(e.latlng, {
          key: this._key,
          keyInx: this._keyInx,
          draggable: true,
          icon: this._getTextMarkerIcon(_distance, this._key)
        })
        this._measureLayers.addLayer(marker)
        marker.on('dragend', this._markerDragend, this)
        marker.on('drag', this._markerDrag, this)
      } else {
        if (
          this.options.isMeasure ||
          e.originalEvent.metaKey ||
          e.originalEvent.shiftKey ||
          e.originalEvent.ctrlKey ||
          e.originalEvent.altKey
        ) {
          this._latlngs[this._key] = [e.latlng]

          this._currentMeasureLine = L.polyline(
            [],
            Object.assign({ key: this._key }, this.options.line)
          )

          let marker = L.marker(e.latlng, {
            key: this._key,
            keyInx: this._keyInx,
            draggable: true,
            icon: this._getTextMarkerIcon('起点', this._key)
          })
          this._measureLayers.addLayer(marker)
          marker.on('dragend', this._markerDragend, this)
          marker.on('drag', this._markerDrag, this)

          this._tempCurrentMeasureTextMarker = L.marker(e.latlng, {
            key: this._key,
            icon: this._getTempTextMarkerIcon()
          })

          this._tempCurrentMeasureLine = L.polyline(
            [],
            Object.assign({ key: this._key }, this.options.line)
          )

          this._measureLayers.addLayer(this._currentMeasureLine)
          this._measureLayers.addLayer(this._tempCurrentMeasureLine)
          this._measureLayers.addLayer(this._tempCurrentMeasureTextMarker)
          this._map.on('mousemove', this._measureMouseMove, this)
        }
      }
    }, 250)
  },
  _measureDbClick (e) {
    clearTimeout(this.maptimer)
    // console.log('measureDbClick')
    let curlatlngs = this._latlngs[this._key]
    if (curlatlngs && curlatlngs.length > 0 && this._curMesure) {
      curlatlngs.push(e.latlng)
      this._currentMeasureLine.setLatLngs(curlatlngs)

      this._curMesure = false

      this._map.off('mousemove', this._measureMouseMove, this)

      this._keyInx += 1

      let marker = L.marker(e.latlng, {
        key: this._key,
        keyInx: this._keyInx,
        draggable: true,
        icon: this._getTextMarkerIcon(
          this._getTotalDistance(this._key),
          this._key,
          true
        )
      })
      this._measureLayers.addLayer(marker)
      marker.on('dragend', this._markerDragend, this)
      marker.on('drag', this._markerDrag, this)

      this._measureLayers.removeLayer(this._tempCurrentMeasureTextMarker)
      this._measureLayers.removeLayer(this._tempCurrentMeasureLine)

      this._key++
      this._keyInx = 0
    }
  },
  _measureMouseMove (e) {
    let latLngs = this._latlngs[this._key]
    let lastLatlngs = latLngs[latLngs.length - 1]

    this._tempCurrentMeasureLine.setLatLngs([lastLatlngs, e.latlng])

    let _distance = this._getDistance(lastLatlngs, e.latlng)
    this._tempCurrentMeasureTextMarker
      .setLatLng(e.latlng)
      .setIcon(this._getTempTextMarkerIcon(_distance))
  },
  _markerDrag (e) {
    let key = e.target.options.key
    let inx = e.target.options.keyInx

    const layArr = this._measureLayers.getLayers()

    let latLngs = this._latlngs[key]
    latLngs[inx] = e.target._latlng

    let lineArr = layArr.filter((it) => it.options.key === key && it._bounds)
    lineArr[0].setLatLngs(latLngs)
  },
  _markerDragend (e) {
    let key = e.target.options.key
    let inx = e.target.options.keyInx

    const layArr = this._measureLayers.getLayers()

    let latLngs = this._latlngs[key]
    latLngs[inx] = e.target._latlng

    let lineArr = layArr.filter((it) => it.options.key === key && it._bounds)
    lineArr[0].setLatLngs(latLngs)

    let marArr = layArr.filter((it) => it.options.key === key && !it._bounds)
    // 拖动起点
    if (inx === 0) {
      marArr.forEach((mark) => {
        if (mark.options.keyInx === inx + 1) {
          let _distance = this._getDistance(e.target._latlng, mark._latlng)
          mark.setIcon(this._getTextMarkerIcon(_distance, key))
        }
      })
    }
    // 其他点
    if (inx > 0 && inx < marArr.length - 1) {
      let _distance = 0
      marArr.forEach((mark) => {
        if (
          (mark.options.keyInx === inx + 1 && inx + 1 !== marArr.length) ||
          (mark.options.keyInx === inx - 1 && inx - 1 !== 0)
        ) {
          _distance = this._getDistance(e.target._latlng, mark._latlng)
          mark.setIcon(this._getTextMarkerIcon(_distance, key))
        } else if (mark.options.keyInx === inx) {
          _distance = this._getDistance(
            marArr[inx - 1]._latlng,
            e.target._latlng
          )
          mark.setIcon(this._getTextMarkerIcon(_distance, key))
        }
      })
    }
    // 总长度
    let lastMarker = marArr[marArr.length - 1]
    lastMarker.setIcon(
      this._getTextMarkerIcon(this._getTotalDistance(key), key, true)
    )
  },
  _getTextMarkerIcon (_distance, _key, isEnd) {
    let html = this._getHtml(true, _distance, _key, isEnd)
    return L.divIcon({
      html
    })
  },
  _getTempTextMarkerIcon (_distance) {
    const html = this._getHtml(false, _distance)
    return L.divIcon({
      html,
      iconSize: [80, 24],
      iconAnchor: [5, -10]
    })
  },
  _getTotalDistance (key) {
    let latLngs = this._latlngs[key]
    let total = 0
    for (let i = 1; i < latLngs.length; i++) {
      let _distance = latLngs[i].distanceTo(latLngs[i - 1])
      total += _distance
    }
    if (total > 5000) {
      total = (total * 0.001).toFixed(2) + ' km'
    } else {
      total = total.toFixed(0) + ' m'
    }
    return total
  },
  _getDistance (startPoint, endPoint) {
    let _distance = endPoint.distanceTo(startPoint)
    if (_distance > 5000) {
      _distance = (_distance * 0.001).toFixed(2) + ' km'
    } else {
      _distance = _distance.toFixed(0) + ' m'
    }
    return _distance
  },
  _getHtml (isMark, content, _key, isEnd) {
    const el = document.createElement('div')
    el.className = 'measure-wrap'

    if (isMark) {
      const div = document.createElement('div')
      div.className = 'my-measure-icon-marker'
      el.appendChild(div)
    }

    const text = document.createElement('div')
    text.className = isEnd ? 'measure-value measure-end' : 'measure-value'
    text.innerHTML = isEnd ? '总长：' + content : content
    el.appendChild(text)

    if (isEnd) {
      const close = document.createElement('span')
      close.className = 'measure-close'
      close.dataset.key = _key
      close.addEventListener('click', (e) => {
        const key = Number(e.target.dataset.key)
        const layArr = this._measureLayers.getLayers()
        if (key && layArr.length > 0) {
          for (let i = 0; i < layArr.length; i++) {
            if (key === layArr[i].options.key)
              this._measureLayers.removeLayer(layArr[i])
          }
        }
        e.stopPropagation()
      })
      el.appendChild(close)
    }

    return el
  }
})

L.Map.mergeOptions({
  measureControl: false
})

L.Map.addInitHook(function () {
  if (this.options.measureControl) {
    this.measureControl = new L.Control.Measure().addTo(this)
  }
})

L.control.measure = function (options) {
  return new L.Control.Measure(options)
}
