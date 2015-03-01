//# dc.js Getting Started and How-To Guide
'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

// ### Create Chart Objects
// Create chart objects assocated with the container elements identified by the css selector.
// Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or
// filtered by other page controls.
var earningsCategoriesChart = dc.pieChart('#earnings-categories-chart');
var genderChart = dc.pieChart('#gender-chart');
var fluctuationChart = dc.barChart('#fluctuation-chart');
var quarterChart = dc.pieChart('#quarter-chart');
var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
var earningsChart = dc.lineChart('#earnings-chart');
var earningsVolumeChart = dc.barChart('#earnings-volume-chart');
var monthlyBubbleChart = dc.bubbleChart('#monthly-bubble-chart');
var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

// ### Anchor Div for Charts
/*
// A div anchor that can be identified by id
  <div id='your-chart'></div>
// Title or anything you want to add above the chart
  <div id='chart'><span>Days by Gain or Loss</span></div>
// ##### .turnOnControls()
// If a link with css class 'reset' is present then the chart
// will automatically turn it on/off based on whether there is filter
// set on this chart (slice selection for pie chart and brush
// selection for bar chart). Enable this with `chart.turnOnControls(true)`
   <div id='chart'>
     <a class='reset' href='javascript:myChart.filterAll();dc.redrawAll();' style='display: none;'>reset</a>
   </div>
// dc.js will also automatically inject applied current filter value into
// any html element with css class set to 'filter'
  <div id='chart'>
    <span class='reset' style='display: none;'>Current filter: <span class='filter'></span></span>
  </div>
*/

//### Load your data
//Data can be loaded through regular means with your
//favorite javascript library
//
//```javascript
//d3.csv('data.csv', function(data) {...};
//d3.json('data.json', function(data) {...};
//jQuery.getJson('data.json', function(data){...});
//```
d3.csv('incentives_daily.csv', function (data) {
  /* since its a csv file we need to format the data a bit */
  var dateFormat = d3.time.format('%Y-%m-%d');
  var numberFormat = d3.format('.2f');

  data.forEach(function (d) {
    d.dd = dateFormat.parse(d.date);
    d.month = d3.time.month(d.dd).getMonth(); // pre-calculate month for better performance
    d.amount_possible = +d.amount_possible; // coerce to number
    d.amount = +d.amount;
  });

  //### Create Crossfilter Dimensions and Groups
  //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
  var incentives = crossfilter(data);
  var all = incentives.groupAll();

  // dimension by year
  var monthlyDimension = incentives.dimension(function (d) {
    return monthNames[d.month];
  });
  // maintain running tallies by year as filters are applied or removed
  var monthlyPerformanceGroup = monthlyDimension.group().reduce(
    /* callback for when data is added to the current filter results */
    function (p, v) {
      ++p.count;
      p.amount += v.amount;
      p.amountPossible += v.amount_possible;
      p.claimedPercentage = (p.amount / p.amountPossible) * 100;
      return p;
    },
    /* callback for when data is removed from the current filter results */
    function (p, v) {
      --p.count;
      p.amount -= v.amount;
      p.amountPossible -= v.amount_possible;
      p.claimedPercentage = (p.amount / p.amountPossible) * 100;
      return p;
    },
    /* initialize p */
    function () {
      return {
        count: 0,
        amount: 0,
        amountPossible: 0,
        claimedPercentage: 0,
      };
    }
  );

  // dimension by full date
  var dateDimension = incentives.dimension(function (d) {
    return d.dd;
  });

  // dimension by day
  var earningsDays = incentives.dimension(function (d) {
    return d.dd;
  });
  // group by total volume for the day
  var earningsVolumeByDayGroup = earningsDays.group().reduceSum(function (d) {
    return d.amount;
  });
  var incentiveEarningsByDayGroup = earningsDays.group().reduce(
    function (p, v) {
      ++p.days;
      p.total[v.incentive] += v.amount;
      return p;
    },
    function (p, v) {
      --p.days;
      p.total[v.incentive] -= v.amount;
      return p;
    },
    function () {
      return { days: 0, total: { steps: 0, sleep: 0, food: 0 }};
    }
  );

  // create categorical dimension on Incentive type
  var earningsCategories = incentives.dimension(function (d) {
    // return d.amount > d.amount_possible ? 'Loss' : 'Gain';
    return d.incentive;
  });
  // produce counts records in the dimension
  var earningsCategoriesGroup = earningsCategories.group();

  // create categorical dimension on gender
  var gender = incentives.dimension(function (d) {
    return d.gender;
  });
  // produce counts records in the dimension
  var genderGroup = gender.group();

  // determine a histogram of percent changes
  var fluctuation = incentives.dimension(function (d) {
    return Math.round((d.amount_possible - d.amount) / d.amount * 100);
  });
  var fluctuationGroup = fluctuation.group();

  // summerize volume by quarter
  var quarter = incentives.dimension(function (d) {
    var month = d.dd.getMonth();
    if (month <= 2) {
      return 'Q1';
    } else if (month > 2 && month <= 5) {
      return 'Q2';
    } else if (month > 5 && month <= 8) {
      return 'Q3';
    } else {
      return 'Q4';
    }
  });
  var quarterGroup = quarter.group().reduceSum(function (d) {
    return d.amount;
  });

  // counts per weekday
  var dayOfWeek = incentives.dimension(function (d) {
    var day = d.dd.getDay();
    var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return day + '.' + name[day];
  });
  var dayOfWeekGroup = dayOfWeek.group();

  //### Define Chart Attributes
  //Define chart attributes using fluent methods. See the
  // [dc API Reference](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md) for more information
  //

  //#### Bubble Chart
  //Create a bubble chart and use the given css selector as anchor. You can also specify
  //an optional chart group for this chart to be scoped within. When a chart belongs
  //to a specific group then any interaction with such chart will only trigger redraw
  //on other charts within the same chart group.
  /* dc.bubbleChart('#monthly-bubble-chart', 'chartGroup') */
  monthlyBubbleChart
    .width(990) // (optional) define chart width, :default = 200
    .height(250)  // (optional) define chart height, :default = 200
    .transitionDuration(1500) // (optional) define chart transition duration, :default = 750
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(monthlyDimension)
    //Bubble chart expect the groups are reduced to multiple values which would then be used
    //to generate x, y, and radius for each key (bubble) in the group
    .group(monthlyPerformanceGroup)
    .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
    .colorDomain([-500, 500]) //(optional) define color domain to match your data domain if you want to bind data or
                  //color
    //##### Accessors
    //Accessor functions are applied to each value returned by the grouping
    //
    //* `.colorAccessor` The returned value will be mapped to an internal scale to determine a fill color
    //* `.keyAccessor` Identifies the `X` value that will be applied against the `.x()` to identify pixel location
    //* `.valueAccessor` Identifies the `Y` value that will be applied agains the `.y()` to identify pixel location
    //* `.radiusValueAccessor` Identifies the value that will be applied agains the `.r()` determine radius size,
    //*     by default this maps linearly to [0,100]
    .colorAccessor(function (d) {
      return d.value.claimedPercentage;
    })
    .keyAccessor(function (p) {
      return p.value.amount;
    })
    .valueAccessor(function (p) {
      return p.value.claimedPercentage;
    })
    .radiusValueAccessor(function (p) {
      return p.value.amount;
    })
    .maxBubbleRelativeSize(0.3)
    .x(d3.scale.linear().domain([200, 2500]))
    .y(d3.scale.linear().domain([0, 100]))
    .r(d3.scale.linear().domain([0, 400000]))
    //##### Elastic Scaling
    //`.elasticX` and `.elasticX` determine whether the chart should rescale each axis to fit data.
    //The `.yAxisPadding` and `.xAxisPadding` add padding to data above and below their max values in the same unit domains as the Accessors.
    // .elasticY(true)
    .elasticX(true)
    .yAxisPadding(10)
    .xAxisPadding(200)
    .renderHorizontalGridLines(true) // (optional) render horizontal grid lines, :default=false
    .renderVerticalGridLines(true) // (optional) render vertical grid lines, :default=false
    .xAxisLabel('Amount Earned') // (optional) render an axis label below the x axis
    .yAxisLabel('Amount                                                                                                                                                   Earned %') // (optional) render a vertical axis lable left of the y axis
    //#### Labels and  Titles
    //Labels are displaed on the chart for each bubble. Titles displayed on mouseover.
    .renderLabel(true) // (optional) whether chart should render labels, :default = true
    .label(function (p) {
      return p.key;
    })
    .renderTitle(true) // (optional) whether chart should render titles, :default = false
    .title(function (p) {
      return [
        p.key,
        'Count: ' + numberFormat(p.value.count),
        'Total Amount: ' + numberFormat(p.value.amount),
        'Total Amount Possible: ' + numberFormat(p.value.amountPossible),
        'Claimed Percentage: ' + numberFormat(p.value.claimedPercentage) + '%'
      ].join('\n');
    })
    //#### Customize Axis
    //Set a custom tick format. Note `.yAxis()` returns an axis object, so any additional method chaining applies
    //to the axis, not the chart.
    .yAxis().tickFormat(function (v) {
      return v + '%';
    });

  // #### Pie/Donut Chart
  // Create a pie chart and use the given css selector as anchor. You can also specify
  // an optional chart group for this chart to be scoped within. When a chart belongs
  // to a specific group then any interaction with such chart will only trigger redraw
  // on other charts within the same chart group.

  earningsCategoriesChart
    .width(180) // (optional) define chart width, :default = 200
    .height(180) // (optional) define chart height, :default = 200
    .radius(80) // define pie radius
    .dimension(earningsCategories) // set dimension
    .group(earningsCategoriesGroup) // set group
    /* (optional) by default pie chart will use group.key as its label
     * but you can overwrite it with a closure */
    .label(function (d) {
      if (earningsCategoriesChart.hasFilter() && !earningsCategoriesChart.hasFilter(d.key)) {
        return d.key + '(0%)';
      }
      var label = d.key;
      if (all.value()) {
        label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
      }
      return label;
    }) /*
    // (optional) whether chart should render labels, :default = true
    .renderLabel(true)
    // (optional) if inner radius is used then a donut chart will be generated instead of pie chart
    .innerRadius(40)
    // (optional) define chart transition duration, :default = 350
    .transitionDuration(500)
    // (optional) define color array for slices
    .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    // (optional) define color domain to match your data domain if you want to bind data or color
    .colorDomain([-1750, 1644])
    // (optional) define color value accessor
    .colorAccessor(function(d, i){return d.value;})
    */;

  genderChart
    .width(180)
    .height(180)
    .radius(80)
    .dimension(gender)
    .group(genderGroup)
    .label(function (d) {
      if (genderChart.hasFilter() && !genderChart.hasFilter(d.key)) {
        return d.key + '(0%)';
      }
      var label = d.key;
      if (all.value()) {
        label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
      }
      return label;
    }) /*
    // (optional) whether chart should render labels, :default = true
    .renderLabel(true)
    // (optional) if inner radius is used then a donut chart will be generated instead of pie chart
    .innerRadius(40)
    // (optional) define chart transition duration, :default = 350
    .transitionDuration(500)
    // (optional) define color array for slices
    .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    // (optional) define color domain to match your data domain if you want to bind data or color
    .colorDomain([-1750, 1644])
    // (optional) define color value accessor
    .colorAccessor(function(d, i){return d.value;})
    */;

  quarterChart.width(180)
    .height(180)
    .radius(80)
    .innerRadius(30)
    .dimension(quarter)
    .group(quarterGroup);

  //#### Row Chart
  dayOfWeekChart.width(180)
    .height(180)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .group(dayOfWeekGroup)
    .dimension(dayOfWeek)
    // assign colors to each value in the x scale domain
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .label(function (d) {
      return d.key.split('.')[1];
    })
    // title sets the row text
    .title(function (d) {
      return d.value;
    })
    .elasticX(true)
    .xAxis().ticks(4);

  //#### Bar Chart
  // Create a bar chart and use the given css selector as anchor. You can also specify
  // an optional chart group for this chart to be scoped within. When a chart belongs
  // to a specific group then any interaction with such chart will only trigger redraw
  // on other charts within the same chart group.
  /* dc.barChart('#volume-month-chart') */
  fluctuationChart.width(420)
    .height(180)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(fluctuation)
    .group(fluctuationGroup)
    .elasticY(true)
    // (optional) whether bar should be center to its x value. Not needed for ordinal chart, :default=false
    .centerBar(true)
    // (optional) set gap between bars manually in px, :default=2
    .gap(1)
    // (optional) set filter brush rounding
    .round(dc.round.floor)
    .alwaysUseRounding(true)
    .x(d3.scale.linear().domain([-25, 25]))
    .renderHorizontalGridLines(true)
    // customize the filter displayed in the control span
    .filterPrinter(function (filters) {
      var filter = filters[0], s = '';
      s += numberFormat(filter[0]) + '% -> ' + numberFormat(filter[1]) + '%';
      return s;
    });

  // Customize axis
  fluctuationChart.xAxis().tickFormat(
    function (v) { return v + '%'; });
  fluctuationChart.yAxis().ticks(5);

  //#### Stacked Area Chart
  //Specify an area chart, by using a line chart with `.renderArea(true)`
  earningsChart
    .renderArea(true)
    .width(990)
    .height(200)
    .transitionDuration(1000)
    .margins({top: 30, right: 50, bottom: 25, left: 40})
    .dimension(earningsDays)
    .mouseZoomable(true)
    // Specify a range chart to link the brush extent of the range with the zoom focue of the current chart.
    .rangeChart(earningsVolumeChart)
    .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 31)]))  // TODO: Replace with first/last data entry dates
    // .round(d3.time.month.round)
    .xUnits(d3.time.days)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
    .brushOn(false)
    // Add the base layer of the stack with group. The second parameter specifies a series name for use in the legend
    // The `.valueAccessor` will be used for the base layer
    .group(incentiveEarningsByDayGroup, 'Steps Earnings')
    .valueAccessor(function (d) {
      // console.log('>>>> d.value.total.steps', d.value.total.steps);
      return d.value.total.steps;
    })
    // stack additional layers with `.stack`. The first paramenter is a new group.
    // The second parameter is the series name. The third is a value accessor.
    .stack(incentiveEarningsByDayGroup, 'Sleep Earnings', function (d) {
      // console.log('>>>> d.value.total.sleep', d.value.total.sleep);
      return d.value.total.sleep;
    })
    .stack(incentiveEarningsByDayGroup, 'Food Earnings', function (d) {
      // console.log('>>>> d.value.total.food', d.value.total.food);
      return d.value.total.food;
    })
    // title can be called by any stack layer.
    .title(function (d) {
      var value = d.value.avg ? d.value.avg : d.value;
      if (isNaN(value)) {
        value = 0;
      }
      return dateFormat(d.key) + '\n' + numberFormat(value);
    });

  earningsVolumeChart.width(990)
    .height(40)
    .margins({top: 0, right: 50, bottom: 20, left: 40})
    .dimension(earningsDays)
    .group(earningsVolumeByDayGroup)
    .centerBar(true)
    .gap(1)
    .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 31)]))  // TODO: Replace with first/last data entry dates
    .round(d3.time.day.round)
    .alwaysUseRounding(true)
    .xUnits(d3.time.days);

  /*
  //#### Data Count
  // Create a data count widget and use the given css selector as anchor. You can also specify
  // an optional chart group for this chart to be scoped within. When a chart belongs
  // to a specific group then any interaction with such chart will only trigger redraw
  // on other charts within the same chart group.
  <div id='data-count'>
    <span class='filter-count'></span> selected out of <span class='total-count'></span> records
  </div>
  */
  dc.dataCount('.dc-data-count')
    .dimension(incentives)
    .group(all)
    // (optional) html, for setting different html for some records and all records.
    // .html replaces everything in the anchor with the html given using the following function.
    // %filter-count and %total-count are replaced with the values obtained.
    .html({
      some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
        ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
      all:'All records selected. Please click on the graph to apply filters.'
    });

  /*
  //#### Data Table
  // Create a data table widget and use the given css selector as anchor. You can also specify
  // an optional chart group for this chart to be scoped within. When a chart belongs
  // to a specific group then any interaction with such chart will only trigger redraw
  // on other charts within the same chart group.
  <!-- anchor div for data table -->
  <div id='data-table'>
    <!-- create a custom header -->
    <div class='header'>
      <span>Date</span>
      <span>Open</span>
      <span>Close</span>
      <span>Change</span>
      <span>Volume</span>
    </div>
    <!-- data rows will filled in here -->
  </div>
  */
  dc.dataTable('.dc-data-table')
    .dimension(dateDimension)
    // data table does not use crossfilter group but rather a closure
    // as a grouping function
    .group(function (d) {
      return monthNames[d.dd.getMonth()] + ' ' + d.dd.getFullYear();
    })
    .size(10) // (optional) max number of records to be shown, :default = 25
    // There are several ways to specify the columns; see the data-table documentation.
    // This code demonstrates generating the column header automatically based on the columns.
    .columns([
      'date',    // d['date'], ie, a field accessor; capitalized automatically
      'incentive',
      'amount',
      'amount_possible',
      {
        label: 'Percent Earned', // desired format of column name 'Change' when used as a label with a function.
        format: function (d) {
          return numberFormat(d.amount / d.amount_possible + 100);
        }
      },
      'uid',
      'gender',
      'age'
    ])

    // (optional) sort using the given field, :default = function(d){return d;}
    .sortBy(function (d) {
      return d.dd;
    })
    // (optional) sort order, :default ascending
    .order(d3.ascending)
    // (optional) custom renderlet to post-process chart using D3
    .renderlet(function (table) {
      table.selectAll('.dc-table-group').classed('info', true);
    });

  /*
  //#### Geo Choropleth Chart
  //Create a choropleth chart and use the given css selector as anchor. You can also specify
  //an optional chart group for this chart to be scoped within. When a chart belongs
  //to a specific group then any interaction with such chart will only trigger redraw
  //on other charts within the same chart group.
  dc.geoChoroplethChart('#us-chart')
    .width(990) // (optional) define chart width, :default = 200
    .height(500) // (optional) define chart height, :default = 200
    .transitionDuration(1000) // (optional) define chart transition duration, :default = 1000
    .dimension(states) // set crossfilter dimension, dimension key should match the name retrieved in geo json layer
    .group(stateRaisedSum) // set crossfilter group
    // (optional) define color function or array for bubbles
    .colors(['#ccc', '#E2F2FF','#C4E4FF','#9ED2FF','#81C5FF','#6BBAFF','#51AEFF','#36A2FF','#1E96FF','#0089FF',
      '#0061B5'])
    // (optional) define color domain to match your data domain if you want to bind data or color
    .colorDomain([-5, 200])
    // (optional) define color value accessor
    .colorAccessor(function(d, i){return d.value;})
    // Project the given geojson. You can call this function mutliple times with different geojson feed to generate
    // multiple layers of geo paths.
    //
    // * 1st param - geo json data
    // * 2nd param - name of the layer which will be used to generate css class
    // * 3rd param - (optional) a function used to generate key for geo path, it should match the dimension key
    // in order for the coloring to work properly
    .overlayGeoJson(statesJson.features, 'state', function(d) {
      return d.properties.name;
    })
    // (optional) closure to generate title for path, :default = d.key + ': ' + d.value
    .title(function(d) {
      return 'State: ' + d.key + '\nTotal Amount Raised: ' + numberFormat(d.value ? d.value : 0) + 'M';
    });

    //#### Bubble Overlay Chart
    // Create a overlay bubble chart and use the given css selector as anchor. You can also specify
    // an optional chart group for this chart to be scoped within. When a chart belongs
    // to a specific group then any interaction with such chart will only trigger redraw
    // on other charts within the same chart group.
    dc.bubbleOverlay('#bubble-overlay')
      // bubble overlay chart does not generate it's own svg element but rather resue an existing
      // svg to generate it's overlay layer
      .svg(d3.select('#bubble-overlay svg'))
      .width(990) // (optional) define chart width, :default = 200
      .height(500) // (optional) define chart height, :default = 200
      .transitionDuration(1000) // (optional) define chart transition duration, :default = 1000
      .dimension(states) // set crossfilter dimension, dimension key should match the name retrieved in geo json
        layer
      .group(stateRaisedSum) // set crossfilter group
      // closure used to retrieve x value from multi-value group
      .keyAccessor(function(p) {return p.value.absGain;})
      // closure used to retrieve y value from multi-value group
      .valueAccessor(function(p) {return p.value.percentageGain;})
      // (optional) define color function or array for bubbles
      .colors(['#ccc', '#E2F2FF','#C4E4FF','#9ED2FF','#81C5FF','#6BBAFF','#51AEFF','#36A2FF','#1E96FF','#0089FF',
        '#0061B5'])
      // (optional) define color domain to match your data domain if you want to bind data or color
      .colorDomain([-5, 200])
      // (optional) define color value accessor
      .colorAccessor(function(d, i){return d.value;})
      // closure used to retrieve radius value from multi-value group
      .radiusValueAccessor(function(p) {return p.value.claimedPercentage;})
      // set radius scale
      .r(d3.scale.linear().domain([0, 3]))
      // (optional) whether chart should render labels, :default = true
      .renderLabel(true)
      // (optional) closure to generate label per bubble, :default = group.key
      .label(function(p) {return p.key.getFullYear();})
      // (optional) whether chart should render titles, :default = false
      .renderTitle(true)
      // (optional) closure to generate title per bubble, :default = d.key + ': ' + d.value
      .title(function(d) {
        return 'Title: ' + d.key;
      })
      // add data point to it's layer dimension key that matches point name will be used to
      // generate bubble. multiple data points can be added to bubble overlay to generate
      // multiple bubbles
      .point('California', 100, 120)
      .point('Colorado', 300, 120)
      // (optional) setting debug flag to true will generate a transparent layer on top of
      // bubble overlay which can be used to obtain relative x,y coordinate for specific
      // data point, :default = false
      .debug(true);
  */

  //#### Rendering
  //simply call renderAll() to render all charts on the page
  dc.renderAll();
  /*
  // or you can render charts belong to a specific chart group
  dc.renderAll('group');
  // once rendered you can call redrawAll to update charts incrementally when data
  // change without re-rendering everything
  dc.redrawAll();
  // or you can choose to redraw only those charts associated with a specific chart group
  dc.redrawAll('group');
  */

});

//#### Version
//Determine the current version of dc with `dc.version`
d3.selectAll('#version').text(dc.version);
