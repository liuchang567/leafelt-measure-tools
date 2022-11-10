# leafelt-measure-tool
基于leafelt的简单测量工具 可以使用原来的添加测距按钮，也可以结合项目自己加按钮，调用事件，支持拖动点重新算距离

### 截图

支持连续测量

![enter image description here](https://github.com/liuchang567/mapboxgl-measure-tools/blob/master/assets/result.jpg?inline=false)


#### 先引入leafelt
#### 引入index.js 跟 index.css
```
```js
  // var measureControl = new L.Control.Measure(options)
  // measureControl.addTo(myMap)

  var measureControl = L.control.measure(options)
  measureControl.addTo(myMap)

  // var myMap = L.map('mapElementId', {
  // measureControl: true
  // })

```

#### options  

##### event
```
enableMeasure funtion // 开启测距
disableMeasure funtion // 关闭测距
clearMeasure funtion // 清除测距
```
#### todo...