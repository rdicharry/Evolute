import {Component, OnInit, ElementRef} from "@angular/core";
import {D3Service, D3, Selection} from 'd3-ng2-service';
import {Line} from "../classes/Line";

// create a Graph class if I decide to store graphs later

@Component({
  selector: "graph-component",
  templateUrl: "../templates/graph.html"
})

export class GraphComponent implements OnInit {

  constructor(element: ElementRef, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    this.mathjs = require('mathjs');
  }

  private mathjs;

  private d3: D3;
  private parentNativeElement: any;

  private svgWidth = 500;
  private svgHeight = 500;

  public a:number = -3.2;
  public b:number = 3;

  public x: Array<number>;
  public y: Array<number>;

  public xexpression: String = "t";
  public yexpression: String = "t^2";

  private xfuncTree;
  private yfuncTree;
  private scope = {};
  public xfunc = function(t){return Math.cos(t)}; // parameterized function for x values
  public yfunc = function(t){return Math.sin(t)}; // parameterized function for y values

  svg;


  private numCurvePoints = 1000; // input points for drawing curve
  public numPoints:number = 15; // user-chosen number of sampling
  // points for drawing the evolute

  ngOnInit(){
    this.redrawSVG();

  }

  redrawSVG(){

    /*this.xfuncTree = this.mathjs.parse(this.xexpression).compile();
    this.yfuncTree = this.mathjs.parse(this.yexpression).compile();
    this.xfunc = function(ti){return this.xfuncTree.eval({t: ti})};
    this.yfunc = function(ti){return this.yfuncTree.eval({t: ti})};*/
    this.scope = {};

    this.xfunc = this.mathjs.eval('x(t) = '+this.xexpression, this.scope);
    this.yfunc = this.mathjs.eval('y(t) = '+this.yexpression, this.scope);



    let d3 = this.d3;
    this.drawSVG(d3);
  }

  /**
   * find the first derivative for a parameterized curve given by x(t) y(t)
   * a the specified sample points, spaced increment units apart
   * @return an array of objects {x:dx/dt,y:dy/dt}
   */
  samplePointsDerivative(samplePoints, increment, x, y){

    return samplePoints.map((elem, index)=>{
      let t = elem/* + increment*index*/;
      return {
        /* tangent slope calculated over 2*increment (2*delta t) in order
        to ensure it is *centered* on the sample point, rather than off to the side
         */
        y: (y(t+increment/2)-y(t-increment/2))/(increment),
        x: (x(t+increment/2)-x(t-increment/2))/(increment)
      };
    });

  }

  /**
   * find the second derivative for a parameterized curve given by x(t) y(t)
   * at the specified sampel points, spaced increment units apart
   *
   */
  samplePointsSecondDerivative(samplePoints, increment, x, y){

    return samplePoints.map((elem, index)=>{
      let t = elem/*+increment*index*/;
      return {
        y: (((y(t+increment)-y(t))/increment)-((y(t)-y(t-increment))/increment))/(increment),
        x: (((x(t+increment)-x(t))/increment)-((x(t)-x(t-increment))/increment))/(increment)
      }
    });

  }

  createAndScaleNormalVectors(firstDerivativePoints, curvaturePoints){
    // create and normalize normal vectors, then scale normal vectors to length of curvature at that point
    return firstDerivativePoints.map((elem, index)=>{
      let mag = GraphComponent.magnitude(elem.x, elem.y);
      return {
        x: -(curvaturePoints[index])*(elem.y/mag),
        y: (curvaturePoints[index])*(elem.x/mag)
      }
    });
  }

  createNormalVectors(firstDerivativePoints){
    return firstDerivativePoints.map((elem, index)=>{
      return {
        x: -elem.y,
        y: elem.x
      }
    })
  }

  createNormalLineEndpoints(samplingPointsData, normals, evolutePoints) {
    return samplingPointsData.map((elem, index) => {

      let normalMagnitude = GraphComponent.magnitude(normals[index].x, normals[index].y);
      let evoluteMagnitude = GraphComponent.magnitude(evolutePoints[index][0], evolutePoints[index][1]);
      console.log("normal mag: "+normalMagnitude+", evoluteMag: "+evoluteMagnitude);
      return new Line(elem.x,
        elem.y,
        evolutePoints[index][0],
        evolutePoints[index][1]);/*{
        x1: elem.x,
        y1: elem.y,
        x2: elem.x + (evoluteMagnitude / normalMagnitude) * normals[index].x,
        y2: elem.y + (evoluteMagnitude / normalMagnitude) * normals[index].y
      }*/
    });
  }

  /**
   * reference: wikipedia: osculating circle
   * @param firstDerivativePoints
   * @param secondDerivativePoints
   */
  radiusOfCurvature(firstDerivativePoints, secondDerivativePoints){

    return firstDerivativePoints.map(function(item, index) {
      let xp = firstDerivativePoints[index][0];
      let yp = firstDerivativePoints[index][1];
      let xpp = secondDerivativePoints[index][0];
      let ypp = secondDerivativePoints[index][1];

      return  ((xp**2+yp**2)**1.5)/(xp*ypp-xpp*yp);
    })
  }

  /**
   * // wrong!!
   * calculate curvature at sampling points
   * @param secondDerivative computed at sampling points
   * @returns
   */
  curvature(secondDerivative, normals){

    return secondDerivative.map((elem, index)=>{
      return {
        x: elem.x/normals[index].x,
        y: elem.y/normals[index].y
      }
    })

  }

  /**
   * As defined by doCarmo, Section 1.5 Remark 1
   *
   * note: these are returned inside arrays because the D3 path generator (line function)
   * *requires* that format
   * @param samplePoints
   * @param curvaturePoints
   * @param normalPoints
   */
  evolutePoints(samplePoints, radiusOfCurvaturePoints, normalPoints){
    return samplePoints.map((elem, index)=>{
      //let mag = GraphComponent.magnitude(curvaturePoints[index].x, curvaturePoints[index].y);
      //console.log(mag);
      return [
        elem.x+radiusOfCurvaturePoints[index]*normalPoints[index].x,
        elem.y+radiusOfCurvaturePoints[index]*normalPoints[index].y
      ]
    })

  }

  /** TODO this is wrong!! */
  /*
  radiusOfCurvature(firstDerivative, secondDerivative){

    return secondDerivative.map((elem, index)=>{
      let mag = GraphComponent.magnitude(firstDerivative[index].x, firstDerivative[index].y);
      return (mag**3)/(firstDerivative[index].x*secondDerivative[index].y-firstDerivative[index].y*secondDerivative[index].x)
    })

  }*/

  static magnitude(x,y){
    return Math.sqrt((Math.pow(x,2)+Math.pow(y,2)));
  }

  drawSVG(d3: D3){

    // sample at some number of points for drawing evolute
    let sampleIncrement:number = (this.b-this.a)/this.numPoints;
    let samplePoints = d3.range(this.numPoints).map((elem, index)=>this.a+index*sampleIncrement);

    let tIncrement: number = (this.b-this.a)/this.numCurvePoints;
     // input points for drawing path
    let t = d3.range(this.numCurvePoints).map((elem,index)=>this.a+index*tIncrement);


    this.x = d3.range(this.numCurvePoints).map((elem, index)=>this.xfunc(t[index]));


    this.y = d3.range(this.numCurvePoints).map((elem, index)=>this.yfunc(t[index]));

   // let dataset = new Array(this.numCurvePoints);
    //dataset = dataset.map((elem, index)=>[x[index],y[index]]);

    let dataset = d3.range(this.numCurvePoints-1).map((elem, index)=>{
      return {
        x1: this.x[index],
        y1: this.y[index],
        x2: this.x[index+1],
        y2: this.y[index+1]
      };
    });

    let samplingPointsData = d3.range(this.numPoints).map((elem, index)=>{
      return{
        x: this.xfunc(samplePoints[index]),
        y: this.yfunc(samplePoints[index])
      }
    });

    let d = this.samplePointsDerivative(samplePoints, tIncrement, this.xfunc, this.yfunc);
    let d2 = this.samplePointsSecondDerivative(samplePoints, tIncrement, this.xfunc, this.yfunc);
    //let k = this.curvature(d2);

    let normals = this.createNormalVectors(d);
    console.log("normalPoints: "+normals.map((elem)=>{return "("+elem.x+", "+elem.y+")"}));


    let curvaturePoints = this.curvature(d2, normals);
    console.log("curvaturePoints: "+curvaturePoints.map((elem)=>{return "("+elem.x+", "+elem.y+")"}));
    let evolutePoints = this.evolutePoints(samplingPointsData, curvaturePoints, normals);
    console.log("evolutePoints: "+evolutePoints.map((elem)=>{return "("+elem[0]+", "+elem[1]+")"}));


    // draw normal lines - sampling points data + calculate second point along normal
    // create a set of points for the second point (the one on the evolute curve)
    /*let evolutePoints: [number, number][] = samplingPointsData.map((elem, index): [number, number]=> {
      return [
        Number(elem.x + normals[index].x),
        Number(elem.y + normals[index].y)

      ];
    });*/

    //console.log("evolute xs: "+evolutePoints.map((entry)=> entry.x));
    //console.log("evolute ys: "+evolutePoints.map((entry)=> entry.y));

    // associate sample points and evolute points to generate normal lines
    let normalLines: Array<Line> = this.createNormalLineEndpoints(samplingPointsData, normals, evolutePoints);

    //console.log("evolutePoints: "+evolutePoints);


    // dynamically pick the scales based on min/max of points (including evolute points!)

    let xMin = d3.min(this.x.concat(evolutePoints.map((elem)=>elem[0])));
    let xMax = d3.max(this.x.concat(evolutePoints.map((elem)=>elem[0])));
    let xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, this.svgWidth]);
    let yMin = d3.min(this.y.concat(evolutePoints.map((elem)=>elem[1])));
    let yMax = d3.max(this.y.concat(evolutePoints.map((elem)=>elem[1])));
    let yScale = d3.scaleLinear().domain([yMin, yMax]).range([this.svgHeight, 0]);



    if(this.svg) {
      // clear any existing svg attributes
      this.d3.selectAll("svg").remove();
    }

    this.svg = d3.select("#graph-svg").append("svg");
    this.svg.attr("width", this.svgWidth).attr("height", this.svgHeight);

    let h = this.svgHeight;
    let padding = 30;



    this.svg.append("g").attr("class", "function-lines").selectAll("line").data(dataset).enter()
      .append("line")
      .attr("x1", function(d){return xScale(d.x1);})
      .attr("x2", function(d){return xScale(d.x2);})
      .attr("y1", function(d){return h-yScale(d.y1);})
      .attr("y2", function(d){return h-yScale(d.y2);}).style("stroke", "black").style("stroke-width", 2);

    // draw sampling points for creating evolute

    let msDelay = 200; // ms
    let numPoints=this.numPoints;
    this.svg.append("g").attr("class", "sampling-points").selectAll("circle").data(samplingPointsData).enter()
      .append("circle")
      .transition().delay(function(d, i){
        return i*msDelay;
    })
      .attr("cx", function(d){return xScale(d.x);})
      .attr("cy", function(d){return h-yScale(d.y);}).attr("r", "3").attr("fill", "green");

    this.svg.append("g").attr("class", "normal-lines").selectAll("line").data(normalLines)
      .enter().append("line")
      .transition().delay(function(d, i){
      return numPoints*msDelay+i*msDelay;
    })
      .attr("x1", function(d){return xScale(d.x1)})
      .attr("x2" ,function(d){return xScale(d.x2)})
      .attr("y1", function(d){return h-yScale(d.y1)})
      .attr("y2", function(d){return h-yScale(d.y2)})
      .style("stroke", "gray").style("stroke-width", 2);



    // draw normal end points (samples along evolute curve
    this.svg.append("g").attr("class", "evolute-points").selectAll("circle").data(evolutePoints).enter()
      .append("circle")
      .transition().delay(function(d, i){
      return 2*numPoints*msDelay+i*msDelay;
    })
      .attr("cx", function(d){ return xScale(d[0]);})
      .attr("cy", function(d){return h-yScale(d[1]);}).attr("r", "3").attr("fill", "purple");


/*
    for(let i = 0; i < this.numPoints; i++){

      let g = svg.append("g").attr("class", "sampling-points");
      g.selectAll<SVGCircleElement, any>("circle").data([samplingPointsData[i]]).enter()
        .append<SVGCircleElement>("circle")
        .transition().delay(i*msDelay)
        .attr("cx", function(d){return xScale(d.x);})
        .attr("cy", function(d){return h-yScale(d.y);}).attr("r", "3").attr("fill", "green");

    g.selectAll<SVGLineElement, any>("line").data([normalLines[i]])
        .enter().append<SVGLineElement>("line")
        .transition().delay(i*msDelay)
        .attr("x1", function(d){return xScale(d.x1)})
        .attr("x2" ,function(d){return xScale(d.x2)})
        .attr("y1", function(d){return h-yScale(d.y1)})
        .attr("y2", function(d){return h-yScale(d.y2)})
        .style("stroke", "gray").style("stroke-width", 2);



      // draw normal end points (samples along evolute curve
      g.append("g").selectAll<SVGCircleElement, any>("circle").data([evolutePoints[i]]).enter()
        .append<SVGCircleElement>("circle")
        .transition().delay(i*msDelay)
        .attr("cx", function(d){return xScale(d[0]);})
        .attr("cy", function(d){return h-yScale(d[1]);}).attr("r", "3").attr("fill", "purple");


    }*/


    // draw splines to represent evolute curve:

    // line().x() and line.y() expect input of very specific type:
    let lineFunction = d3.line().curve(d3.curveCatmullRom)
      .x(function (d) {
      return xScale(d[0]);
    })
      .y(function (d) {
        return h-yScale(d[1]);
      });


    console.log("path: "+ lineFunction(evolutePoints));

    this.svg/*.append("g").attr("class", "evolute-curve").selectAll<SVGPathElement, any>("path")*/
      .append("path")
      .transition().delay(3*msDelay*(this.numPoints+1))
      /*.data(evolutePoints).enter()*/.attr("class", "line")
      .attr("d", lineFunction(evolutePoints))
      .attr("stroke", "black").attr("stroke-width", 2).attr("fill", "none");








    // add axes at the end of script so they display on top
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);

    // stroke and fill of axis set in css
    //svg.append("g").call(xAxis);
    //svg.append("g").call(yAxis);
    this.svg.append("g").attr("class", "axis").attr("transform", "translate(0,"+(h-padding)+")").call(xAxis);
    this.svg.append("g").attr("class", "axis").attr("transform", "translate("+padding+/*xScale(xMin)+*/", 0)").call(yAxis);

  }

}
