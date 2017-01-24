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

  drawSVG(d3: D3){

    let sampleIncrement:number = (this.b-this.a)/this.numPoints;
    let samplePoints = d3.range(this.numPoints).map((elem, index)=>this.a+index*sampleIncrement);

    let tIncrement: number = (this.b-this.a)/this.numCurvePoints;
     // input points for drawing path
    let t = d3.range(this.numCurvePoints).map((elem,index)=>this.a+index*tIncrement);


    this.x = d3.range(this.numCurvePoints).map((elem, index)=>this.xfunc(t[index]));


    this.y = d3.range(this.numCurvePoints).map((elem, index)=>this.yfunc(t[index]));

   // let dataset = new Array(this.numCurvePoints);
    //dataset = dataset.map((elem, index)=>[x[index],y[index]]);

    let dataset = d3.range(this.numCurvePoints).map((elem, index)=>{
      return {
        x: this.x[index],
        y: this.y[index]
      };
    });

    let xScale = d3.scaleLinear().domain([d3.min(this.x), d3.max(this.x)]).range([0, this.svgWidth]);
    let yScale = d3.scaleLinear().domain([d3.min(this.y), d3.max(this.y)]).range([0, this.svgHeight]);




    let svg = d3.select("#graph-svg").append("svg");
    svg.attr("width", this.svgWidth).attr("height", this.svgHeight);

    let h = this.svgHeight;
    let padding = 20;

    svg.selectAll<SVGCircleElement, any>("circle").data(dataset).enter()
      .append<SVGCircleElement>("circle")
      .attr("cx", function(d){return xScale(d.x);})
      .attr("cy", function(d){return h-yScale(d.y);}).attr("r", 3);

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
