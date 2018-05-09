//global variables
var keyArray = ["Minimally_Stressed","Stressed_Crisis","Nutrition_Hunger_Index","Aid_Project_allevation","Emergency_Response_cases"];
var expressed = keyArray[0];//initial attribute

// --> CREATE SVG DRAWING AREA
// SVG drawing area
var margin = {top: 80, right: 140, bottom: 52, left: 250};
var width = 1100 - margin.left - margin.right,
		height = 620 - margin.top - margin.bottom;

var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var Minimally_Stressed = "Minimally_Stressed food insecurity",
    Stressed_Crisis = "Food insecurity in Stressed_Crisis mode",
    Nutrition_Hunger_Index= "Alarming food insecurity and nutrition-health deficiency",
    Aid_Project_allevation = "Alarming food insecurity and involvement of Aid projects",
    Emergency_Response_cases= " Emergency Response cases";



var map = d3.select("#choropleth").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(0," + margin.top + ")");

/* Initialize tooltip */
tip = d3.tip().attr('class', 'd3-tip').html(function(d) 
  { return "<strong>Country:</strong> <span style='color:yellow'>" + d.properties.abbrev +
    "</span><p><strong>Data:</strong> <span style='color:yellow'>" + d.properties[expressed]; });

/*
var color = d3.scale.quantize() 
    .range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548"]);
*/
// createLegend(color);


var projection = d3.geo.orthographic()
    .scale(520)
    .translate([width / 2, height / 2]);

    //create svg path generator using the projection
    var path = d3.geo.path()
      .projection(projection);

// Use the Queue.js library to read two files
queue()
  .defer(d3.json, "data/africa.topo.json")
  .defer(d3.csv, "data/FoodInsecurity_Africa.csv")
  .await(function(error, mapTopJson, DataCsv){

    makeCombobox(DataCsv);

    var recolorMap = colorScale(DataCsv);

    var jsonRegions = mapTopJson.objects.collection.geometries;

      //loop through csv to assign each csv values to json region
      for (var i=0; i< DataCsv.length; i++) { 

        var csvRegion = DataCsv[i]; //the current region

        var csvAdm1 = csvRegion.Code; //adm1 code
        //loop through json regions to find right region

        for (var a=0; a < jsonRegions.length; a++){
        //where adm1 codes match, attach csv to json object   
        if (jsonRegions[a].properties.adm0_a3_is == csvAdm1){

          // assign all five key/value pairs  
          for (var key in keyArray){
            var attr = keyArray[key];     
            var val = parseFloat(csvRegion[attr]);
            jsonRegions[a].properties[attr] = val;
          };

          console.log(jsonRegions[a].properties);
          console.log("checking break");

          

          jsonRegions[a].properties.name = csvRegion.name; //set prop
            break; //stop looking through the json regions
          };
        };
      };

      console.log(jsonRegions);

      //add Europe countries geometry to map    
  
      var countries = map.append("path")
          .datum(topojson.feature(mapTopJson, mapTopJson.objects.collection))
          .attr("class", "collection")
          .attr("d", path);

      map.call(tip);


      //add regions to map as enumeration units colored by data
      var regions = map.selectAll(".regions")
        .data(topojson.feature(mapTopJson, mapTopJson.objects.collection).features) //bind regions data to path element
        .enter() //create elements
        .append("path") //append elements to svg
        .attr("class", "regions") //assign class for additional styling
        .attr("id", function(d) { return d.properties.adm0_a3_is })
        .attr("d", path) //project data as geometry in svg
        .style("fill", function(d) { //color enumeration units
          return choropleth(d, recolorMap);
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

  });

function colorScale(csv_data){
  //create quantile classes with color scale
  var color = d3.scale.quantize();

    // array for desired 
    var attributeArray = [];
    for (var i in csv_data){
      attributeArray.push(Number(csv_data[i][expressed]));
      };

      //pass array of expressed values as domain
   
    color
      .domain(attributeArray) 
      .range(colorbrewer.Reds[7]);
     

    var quantize = d3.scale.quantize()
      .domain(attributeArray)
      .range(colorbrewer.Reds[7]);

    var ranges = quantize.range().length;

    // return quantize quantizes for the key    
    var qrange = function(max, num) {
        var a = [];
        for (var i=0; i<num; i++) {
            a.push(i*max/num);
        }
        return a;
    }
  

   var boxmargin = 4,
      lineheight = 14,
      keyheight = 10,
      keywidth = 40,
      boxwidth = 2.8 * keywidth;
     

var title = ['Legend'],
    titleheight = title.length*lineheight + boxmargin;
    

// make legend 
var legend = map.append("g")
    .attr("transform", "translate ("+0+","+40+")")
    .attr("class", "legend");

legend.selectAll("text")
    .data(title)
    .enter().append("text")
    .attr("class", "legend-title")
    .attr("y", function(d, i) { return (i+1)*lineheight-2; })
    .text(function(d) { return d; })

// make legend box 
var lb = legend.append("rect")
    .attr("transform", "translate (0,"+titleheight+")")
    .attr("class", "legend-box")
    .attr("fill", "white")
    .attr("stroke", "gray")
    .attr("width", boxwidth)
    .attr("height", ranges*lineheight+2*boxmargin+lineheight-keyheight);

// make quantized key legend items
var li = legend.append("g")
    .attr("transform", "translate (8,"+(titleheight+boxmargin)+")")
    .attr("class", "legend-items");

li.selectAll("rect")
    .data(quantize.range().map(function(color) {
      var d = quantize.invertExtent(color);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
    .enter().append("rect")
    .attr("y", function(d, i) { return i*lineheight+lineheight-keyheight; })
    .attr("width", keywidth)
    .attr("height", keyheight)
    .style("fill", function(d) { return quantize(d[0]); });
    
li.selectAll("text")
    .data(qrange(quantize.domain()[1], ranges))
    .enter().append("text")
    .attr("x", 48)
    .attr("y", function(d, i) { return (i+1)*lineheight-2; })
    .text(function(d) { return Math.floor(d); });
   
    
    return color;  //return the color scale generator


  };

function choropleth(d, recolorMap){
  //get data value

  var value = d.properties[expressed];

  //if value exists, assign it a color; otherwise assign gray
  if (value)
    return recolorMap(value);
  else 
    return "#ccc";
};

function updateChoropleth(attribute, csv_data){
  //change the expressed attribute
  expressed = attribute;
  
  //recolor the map
  d3.selectAll(".regions") //select every region
    .style("fill", function(d) { //color enumeration units
      return choropleth(d, colorScale(csv_data)); //->
    });
};


function makeCombobox(csv_data){
  //add a select element for the dropdown menu
  var dropdown = d3.select("#menu")
    .append("div")
    .attr("class","dropdown") //for positioning menu with css
    .html("<h4>Sort by:</h4>")
    .append("select")
    .on("change", function(){ updateChoropleth(this.value, csv_data) }); //changes expressed attribute
  
  //create each option element within the dropdown
  dropdown.selectAll("options")
    .data(keyArray)
    .enter()
    .append("option")
    .attr("value", function(d){ return d })
    .text(function(d) {
      d = d[0].toUpperCase() + d.substring(1,3) + " " + d.substring(3);
      return d
    });
    
       
};
