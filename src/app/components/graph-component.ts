import {Component, OnInit, ElementRef} from "@angular/core";
import {D3Service, D3, Selection} from 'd3-ng2-service';

// create a Graph class if I decide to store graphs later

@Component({
  selector: "graph-component",
  templateUrl: "../templates/graph.html"
})

export class GraphComponent implements OnInit {

  constructor(element: ElementRef, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
  }

  private d3: D3;
  private parentNativeElement: any;

  private svgWidth = 500;
  private svgHeight = 500;

  public a:number = 0;
  public b:number = 1;

  public x: Array<number>;
  public y: Array<number>;

  public xfunc = function(t){return t}; // parameterized function for x values
  public yfunc = function(t){return t*t}; // parameterized function for y values



  private numCurvePoints = 1000; // input points for drawing curve
  public numPoints:number = 10; // user-chosen number of sampling
  // points for drawing the evolute

  ngOnInit(){
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
      let t = elem + increment*index;
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
      let t = elem+increment*index;
      return {
        y: (((y(t+increment)-y(t))/increment)-((y(t)-y(t-increment))/increment))/(2*increment),
        x: (((x(t+increment)-x(t))/increment)-((x(t)-x(t-increment))/increment))/(2*increment)
      }
    });

  }

  createAndScaleNormalVectors(firstDerivativePoints, curvaturePoints){
    // create and normalize normal vectors, then scale normal vectors to length of curvature at that point
    return firstDerivativePoints.map((elem, index)=>{
      let mag = GraphComponent.magnitude(elem.x, elem.y);
      return {
        x: -curvaturePoints[index]*(elem.y/mag),
        y: curvaturePoints[index]*(elem.x/mag)
      }
    });
  }

  /**
   * calculate magnitude of second derivative at sampling points
   * @param secondDerivative computed at sampling points
   * @returns
   */
  curvature(secondDerivative){

    return secondDerivative.map((elem)=>{
      return GraphComponent.magnitude(elem.x,elem.y);
    })

  }

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

    //TODO dynamically pick the scales based on min/max of points (including evolute points!)
    let xScale = d3.scaleLinear().domain([/*d3.min(this.x)*/ -1, d3.max(this.x)]).range([0, this.svgWidth]);
    let yScale = d3.scaleLinear().domain([d3.min(this.y), d3.max(this.y)]).range([0, this.svgHeight]);




    let svg = d3.select("#graph-svg").append("svg");
    svg.attr("width", this.svgWidth).attr("height", this.svgHeight);

    let h = this.svgHeight;
    let padding = 20;

    /*svg.selectAll<SVGCircleElement, any>("circle").data(dataset).enter()
      .append<SVGCircleElement>("circle")
      .attr("cx", function(d){return xScale(d.x);})
      .attr("cy", function(d){return h-yScale(d.y);}).attr("r", 3);*/

    svg.append("g").attr("class", "function-lines").selectAll<SVGLineElement, any>("line").data(dataset).enter()
      .append<SVGLineElement>("line")
      .attr("x1", function(d){return xScale(d.x1);})
      .attr("x2", function(d){return xScale(d.x2);})
      .attr("y1", function(d){return h-yScale(d.y1);})
      .attr("y2", function(d){return h-yScale(d.y2);}).style("stroke", "black").style("stroke-width", 2);

    // draw sampling points for creating evolute
    let samplingPointsData = d3.range(this.numPoints).map((elem, index)=>{
      return{
        x: this.xfunc(samplePoints[index]),
        y: this.yfunc(samplePoints[index])
      }
    });

    svg.append("g").attr("class", "sampling-points").selectAll<SVGCircleElement, any>("circle").data(samplingPointsData).enter()
      .append<SVGCircleElement>("circle")
      .attr("cx", function(d){return xScale(d.x);})
      .attr("cy", function(d){return h-yScale(d.y);}).attr("r", "3").attr("fill", "green");


    let d = this.samplePointsDerivative(samplePoints, sampleIncrement, this.xfunc, this.yfunc);
    let d2 = this.samplePointsSecondDerivative(samplePoints, sampleIncrement, this.xfunc, this.yfunc);
    let k = this.curvature(d2);


    let normals = this.createAndScaleNormalVectors(d, k);


    // draw normal lines - sampling points data + calculate second point along normal
    // create a set of points for the second point (the one on the evolute curve)
    let evolutePoints: [number, number][] = samplingPointsData.map((elem, index): [number, number]=> {
      return [
        Number(elem.x + normals[index].x),
        Number(elem.y + normals[index].y)

    ];
    });

    //console.log("evolutePoints: "+evolutePoints);

    // draw normal end points (samples along evolute curve
    svg.append("g").attr("class", "evolute-points").selectAll<SVGCircleElement, any>("circle").data(evolutePoints).enter()
      .append<SVGCircleElement>("circle")
      .attr("cx", function(d){return xScale(d[0]);})
      .attr("cy", function(d){return h-yScale(d[1]);}).attr("r", "3").attr("fill", "purple");

    //console.log("evolute xs: "+evolutePoints.map((entry)=> entry.x));
    //console.log("evolute ys: "+evolutePoints.map((entry)=> entry.y));

    // associate sample points and evolute points to generate normal lines
    let normalLines = samplingPointsData.map((elem, index)=>{
      return {
        x1: elem.x,
        y1: elem.y,
        x2: elem.x+ normals[index].x,
        y2: elem.y+ normals[index].y,
      }
    });

    svg.append("g").attr("class", "normal-lines").selectAll<SVGLineElement, any>("line").data(normalLines)
      .enter().append<SVGLineElement>("line")
      .attr("x1", function(d){return xScale(d.x1)})
      .attr("x2" ,function(d){return xScale(d.x2)})
      .attr("y1", function(d){return h-yScale(d.y1)})
      .attr("y2", function(d){return h-yScale(d.y2)})
      .style("stroke", "gray").style("stroke-width", 2);

    // draw splines to represent evolute curve:

    // line().x() and line.y() expect input of the type:
    // (d:[number, number], index: number, data:[number, number][])=>number)
    // in ohter words, VERY specific about format of input data why?
    let lineFunction = d3.line()/*.curve(d3.curveCatmullRom)*/
      .x(function (d) {
      return xScale(d[0]);
    })
      .y(function (d) {
        return h-yScale(d[1]);
      });

    /*let evoluteCurve = function(d) {
      return d3.line().curve(d3.curveCatmullRom)
        .x(function (d) {
          return d[0]
        })
        .y(function (d) {
          return d[1]
        }); // need to scale x and y?
    };*/



    console.log("path: "+ lineFunction(evolutePoints));

    svg/*.append("g").attr("class", "evolute-curve").selectAll<SVGPathElement, any>("path")*/
      .append<SVGPathElement>("path")
      /*.data(evolutePoints).enter()*/.attr("class", "line")
      .attr("d", /*function(d) {return lineFunction(evolutePoints)}*/lineFunction(evolutePoints))
      .attr("stroke", "black").attr("stroke-width", 2).attr("fill", "none");








    // add axes at the end of script so they display on top
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);

    // stroke and fill of axis set in css
    //svg.append("g").call(xAxis);
    //svg.append("g").call(yAxis);
    svg.append("g").attr("class", "axis").attr("transform", "translate(0,"+(h-padding)+")").call(xAxis);
    svg.append("g").attr("class", "axis").attr("transform", "translate("+padding+", 0)").call(yAxis);

  }

}
