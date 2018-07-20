var map, view, gPoint, gMapClickFlag;
var featureLayer;

function mapInit() {
  require([
    //"esri/config",
    "esri/geometry/Extent",
    "esri/Map",
    //"esri/Graphic",
    "esri/views/MapView",
    "esri/layers/Layer",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/widgets/LayerList",
    "dojo/domReady!"
  ], function(
    //esriConfig,
    Extent,
    Map,
    //Graphic,
    MapView,
    Layer,
    GraphicsLayer,
    FeatureLayer,
    LayerList
  ) {
    //esriConfig.request.corsEnabledServers.push("i.imgur.com");
    //以下為初始化地圖

    var initialExtent = new Extent({
      xmin: -13045631,
      xmax: -13042853,
      ymin: 4034880,
      ymax: 4034881,
      spatialReference: 102100
    });
    //map = new Map({ basemap: "streets-night-vector" });
    map = new Map({ basemap: "streets" });
    view = new MapView({
      container: "viewDiv",
      map: map,
      //extent: initialExtent
      center: [121.533297, 25.048085],
      zoom: 11
    });
    //--------------------------
    //TOC
    var layerList = new LayerList({
      view: view,
      //listItemCreatedFunction: defineActions,
      container: "LayerListArea",
      listItemCreatedFunction: function(event) {
        var item = event.item;
        //console.log(item);
        //console.log(item.layer.id);
        if (item.layer.id === "dangePointLayer") {
          item.actionsSections = [
            [
              {
                title: "test",
                className: "esri-icon-zoom-out-fixed",
                id: "full-extent"
              }
            ]
          ];
        }

        return;
        item.panel = {
          content: "legend",
          open: false
        };
      }
    });

    layerList.on("trigger-action", function(event) {
      console.log(event);
      var id = event.action.id;
      alert(id);
    });

    view.ui.add(layerList, "center-right");
    //----------------------------------------------------------
    try {
      //-----------------------------------------------
      // add an editable featurelayer from portal
      //var featureLayer, editExpand;

      Layer.fromPortalItem({
        portalItem: {
          // autocasts as new PortalItem()
          id: "f0b1bc920fb14d7abf9d67d6d6560d82"
        }
      })
        .then(addLayer)
        .catch(handleLayerLoadError);

      //setupEditing();
      //setupView();
    } catch (e) {
      console.log(e);
    }
    //-----------------------------------------
    var _layer = new GraphicsLayer({ id: "HGL", listMode: "hide" });
    map.add(_layer);

    //-------------------------------

    mapEventSetting();
    $("#btnDelPoint").hide();
  });
}

function mapEventSetting() {
  //---------------------
  $("#btnGetData").on("click", function() {
    showMsg("查詢中...");
    getData();
  });

  $(document).on("click", "#DataList .point", function() {
    var _this = $(this);
    var _x, _y;
    _x = _this.data("x");
    _y = _this.data("y");

    require(["esri/geometry/Point"], function(Point) {
      point = new Point({
        type: "point",
        latitude: _y,
        longitude: _x
      });
      highPoint(point);
      view.goTo(
        {
          target: point,
          zoom: 15
        },
        {
          duration: 2000
        }
      );
    });
  });
  $("#btnAddPoint").on("click", function() {
    gMapClickFlag = "AddPoint";
    showMsg("請在地圖上點選要新增的位置");
  });

  $("#btnDelPoint").on("click", function() {
    var edits = {
      deleteFeatures: [editFeature]
    };
    applyEdits(edits);
  });
  //------------------------------------------
  view.on("click", function(evt) {
    evt.stopPropagation();
    //console.log(evt.mapPoint);
    var _point = evt.mapPoint;

    switch (gMapClickFlag) {
      case "AddPoint":
        showMsg("處理中...");
        require(["esri/Graphic", "dojo/domReady!"], function(Graphic) {
          var _newPoint = _point.clone();
          _newPoint.z = undefined;
          _newPoint.hasZ = false;
          //console.log(_newPoint);

          //--------------------------------
          //測試: 看能不能自訂資料做新增
          /*
           var _newPoint = { type: "point" }; // _point.clone();
          _newPoint.spatialReference = { wkid: 4326 };
          _newPoint.x = -117.17662786791615;
          _newPoint.y = 34.04671451208719;
          */

          //---------------------------
          var newPoint = new Graphic({
            geometry: _newPoint,
            attributes: { PointType: 2 }
          });

          var edits = {
            addFeatures: [newPoint]
          };

          applyEdits(edits);
        });
        break;
      default:
        view.hitTest(evt).then(function(response) {
          unselectFeature();
          if (response.results.length > 0 && response.results[0].graphic) {
            var feature = response.results[0].graphic;
            var _layer = getLayer("dangePointLayer");
            var _objectID = feature.attributes[_layer.objectIdField];

            selectFeature(_objectID);
            showMsg("已點選:" + _objectID);
            $("#btnDelPoint").show();
          } else {
            showMsg("");
          }
        });
    }
  });
}

function showMsg(msg, sec) {
  var _sec = sec || 0;

  $("#lbMsg").html(msg);
  if (sec > 0) {
    setTimeout(function() {
      $("#lbMsg").html("");
    }, _sec);
  }
}

function getLayer(layerID) {
  var _Layer = map.findLayerById(layerID);
  return _Layer;
}

function clearLayer() {
  var _bufferLayer = map.findLayerById("resultsLayer");
  if (_bufferLayer) {
    _bufferLayer.removeAll();
  }
}

//--------------------------------------------
function addLayer(layer) {
  //featureLayer = layer;
  layer.id = "dangePointLayer";
  //layer.refreshInterval = 0.1;
  map.add(layer);
  //alert("addLayer OK");
  //showMsg("圖層載入中...");
}

function applyEdits(params) {
  unselectFeature();
  var _layer = getLayer("dangePointLayer");
  var promise = _layer.applyEdits(params);
  editResultsHandler(promise);
}

function editResultsHandler(promise) {
  promise
    .then(function(editsResult) {
      var extractObjectId = function(result) {
        return result.objectId;
      };

      gMapClickFlag = "";

      // get the objectId of the newly added feature
      if (editsResult.addFeatureResults.length > 0) {
        var adds = editsResult.addFeatureResults.map(extractObjectId);
        newIncidentId = adds[0];
        showMsg("新增完成", 1500);
        selectFeature(newIncidentId);
      } else {
        showMsg("完成", 1500);
      }
      getData();
    })
    .catch(function(error) {
      console.log("===============================================");
      console.error(
        "[ applyEdits ] FAILURE: ",
        error.code,
        error.name,
        error.message
      );
      console.log("error = ", error);
    });
}

function selectFeature(objectId) {
  // symbol for the selected feature on the view
  var selectionSymbol = {
    type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
    color: [0, 0, 0, 0],
    style: "square",
    size: "40px",
    outline: {
      color: [0, 255, 255, 1],
      width: "3px"
    }
  };
  var _layer = getLayer("dangePointLayer");
  var query = _layer.createQuery();
  query.where = _layer.objectIdField + " = " + objectId;

  _layer.queryFeatures(query).then(function(results) {
    if (results.features.length > 0) {
      editFeature = results.features[0];
      editFeature.symbol = selectionSymbol;
      view.graphics.add(editFeature);
    }
  });
}

function handleLayerLoadError(error) {
  console.log("Layer failed to load: ", error);
}

function unselectFeature() {
  //attributeEditing.style.display = "none";
  //updateInstructionDiv.style.display = "block";

  //inputDescription.value = null;
  //inputUserInfo.value = null;
  view.graphics.removeAll();
  var _HGL = getLayer("HGL");
  if (_HGL) {
    _HGL.removeAll();
  }

  $("#btnDelPoint").hide();
}

//-----------------------------
function getData() {
  require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function(
    QueryTask,
    Query
  ) {
    var _url =
      "https://services8.arcgis.com/Hkti9WnVXT9VzWmo/arcgis/rest/services/Taiwan/FeatureServer/0?token=erUP_LaAJL-Ont5L4aRRcOHqdJfV-xYWD4Z9D6QH5XHbwd3LOs3mwnNDLdfZ1hZATeZQHiVDyp3saq4ZQ4b-Pe1ILXsPUyCued9ZX0veYIg8dSwTctj0xGNpGP92LT2DvHVaY3r0n89BSfLlCSZuGnY9Vci7Ro65cGaoB1QlrVdKxPV5vwZ4WWJBoUy_mgUGxyh-yzKuqzzHOJ1laoqg1jP3CZXjE3ngBhiXv0wshQPv9rHX1Q54ztre79Yj1mS7";
    var queryTask = new QueryTask({
      url: _url
    });
    var query = new Query();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.where = "1=1"; // Return all cities with a population greater than 1 million
    // When resolved, returns features and graphics that satisfy the query.
    query.outSpatialReference = 4326;
    queryTask.execute(query).then(function(results) {
      var _features = results.features;
      //console.log(_features);

      showMsg("資料筆數:" + _features.length);

      var _dr = [],
        _attr;
      _dr.push("<tr><th>FID</th><th>PointType</th><th>x</th><th>y</th></tr>");
      for (var i = 0; i < _features.length; i++) {
        _attr = _features[i].attributes;
        _geometry = _features[i].geometry;
        _dr.push(
          "<tr class='point' data-x=" +
            _geometry.x +
            " data-y=" +
            _geometry.y +
            "><td>" +
            _attr.FID +
            "</td><td>" +
            _attr.PointType +
            "</td><td>" +
            _geometry.x.toFixed(6) +
            "</td><td>" +
            _geometry.y.toFixed(6) +
            "</td>"
        );
      }
      $("#DataList").html(_dr.join(""));
    });

    // When resolved, returns a count of the features that satisfy the query.
    /*
    queryTask.executeForCount(query).then(function(results) {
      console.log(results);
    });
    */
  });
}

function highPoint(point) {
  unselectFeature();
  require(["esri/Graphic"], function(Graphic) {
    //以下為指定定位點的圖示
    var Pointmarker = {
      type: "picture-marker",
      url: "http://rawmilk.dk/frontend/images/9aab6af3.eclipse-icon.png",
      width: 22,
      height: 30,
      xoffset: 0,
      yoffset: 11
    };
    //以上為指定定位點的圖示
    //以下將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
    var pinpoint = new Graphic({
      geometry: point, // Add the geometry created in step 4
      symbol: Pointmarker // Add the symbol created in step 5
    });
    var _HGL = getLayer("HGL");
    if (_HGL) {
      _HGL.removeAll();
      _HGL.add(pinpoint);
      //以上將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
    }
  });
}

function defineActions(event) {
  var item = event.item;
  console.log(item);
}
