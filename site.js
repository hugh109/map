var _mapClick = false;
function formInit() {}

//-------------------------------------------------
//以下為HighChart的圖表依據不同區來做顯示，故需要將Buffer交集得到的資料組出Hichart所需要的"series"
function showChart(attr) {
  var _district = []; //把buffer撈回來的資料用迴圈組出總共有幾個區
  //以下要用for迴圈組出有幾區，attr就是交集撈回來的資料
  for (i = 0; i < attr.length; i++) {
    if (_district.indexOf(attr[i]["鄉鎮市"]) == -1) {
      //如果_district裡面出現"沒有"(indexOf)出現過的區名稱的時候
      //attr[i]["鄉鎮市"]的寫法是attr第i個的鄉鎮市(JSON寫法)
      _district.push(attr[i]["鄉鎮市"]); //將該區名稱推到_district這個陣列裡
    } //結果為_district=[大同區,內湖區,中山區]
  }
  //console.log(_district);
  //以上要用for迴圈組出有幾區，attr就是交集撈回來的資料
  //以下要將HighChart中的Series裡的Data(也就是要呈現的資料，在這裡是屋齡+單價)組出
  var _seriesData = []; //先把Data給他一個空的陣列、再把資料用迴圈填入
  var _dt = new Date();
  var _currentYear = _dt.getFullYear(); //現在的年份
  try {
    for (var j = 0; j < _district.length; j++) {
      //這個迴圈將上述組出的鄉鎮市裡的每個鄉鎮都要迴圈跑
      var _vals = []; //將組出來的屋齡,單價放到這個陣列
      for (var i = 0; i < attr.length; i++) {
        //這個迴圈是"如果找出前面組出來的鄉鎮裡對應到交集的feature的鄉鎮市，那就將交集回來的feature的單價跟屋齡推入_val這個陣列"
        if (_district[j] == attr[i]["鄉鎮市"]) {
          _builtAge = _currentYear - (attr[i].Built_Year + 1911);
          _vals.push({
            x: attr[i].單價_元 / 10000,
            y: _builtAge,
            attr: attr[i]
          });
        }
      }
      _seriesData.push({
        name: _district[j],
        data: _vals
      });
    }
  } catch (e) {
    console.log(e);
  }

  //以上要將HighChart中的Series裡的Data(也就是要呈現的資料，在這裡是屋齡+單價)組出

  Highcharts.chart("container", {
    chart: {
      type: "scatter",
      zoomType: "xy",
      backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    title: { text: "taipei house" },
    subtitle: { text: "台北市實價登錄" },
    xAxis: {
      title: { enabled: true, text: "單價元(萬)" },
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true
    },
    yAxis: {
      title: { text: "屋齡(年)" }
    },

    legend: {
      /*
      layout: "vertical",
      align: "left",
      verticalAlign: "top",
      x: 100,
      y: 70,
      floating: true,*/
      backgroundColor:
        (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
        "#FFFFFF",
      borderWidth: 1
    },
    plotOptions: {
      scatter: {
        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: "rgb(100,100,100)"
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        },
        tooltip: {
          headerFormat: "",
          pointFormatter: function() {
            //pointFormatter是HighChart的功能
            var _attr = this.attr; //this是表格裡滑動過去的時候的那個點本身
            console.log(this.index, attr[this.index]);
            highPoint(_attr);
            return "<b>" + _attr.土地區 + "</b><br/>"; //這是Highchart的一個功能組出表格裡的tooltip
          }
        }
      }
    },
    series: _seriesData
  });
}
