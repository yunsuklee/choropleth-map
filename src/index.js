import React from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import * as topojson from "topojson";

/*
  Coded by @yunsuklee

  A project to apply D3 and AJAX in a React App.
  Fetching data from API in JSON format and getting to 
  display the data into a choropleth map using d3 library.
*/

// Variables
const width = 960;
const height = 700;

const urlEducation = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const urlCounty = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

let tooltip = d3
  .select('.container-svg')
  .append('div')
  .attr('id', 'tooltip')
  .attr('class', 
    'container-svg__tooltip ' + 
    'position-absolute ' + 
    'zindex-tooltip ' + 
    'bg-secondary ' +
    'bg-opacity-50 ' + 
    'p-2'
  )
  .style('opacity', 0);

// Geographic path to convert GeoJSON shapes into SVG
let path = d3.geoPath();

// SVG
let svgContainer = d3
  .select('.container-svg')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('class', 'svg mt-5');

// Data fetch
Promise.all([d3.json(urlCounty), d3.json(urlEducation)])
  .then(data => ready(data[0], data[1]))
  .catch(err => console.log(err))

// If promises prove succesful
function ready(usCounties, education) {
  let bachelors = education.map((item) => {
    return item.bachelorsOrHigher;
  });

  let minBachelors = d3.min(bachelors);
  let maxBachelors = d3.max(bachelors);

  // Colors schemes to use in map
  const color = d3
    .scaleThreshold()
    .domain(d3.range(minBachelors, maxBachelors, (maxBachelors - minBachelors) / 8))
    .range(d3.schemeBlues[9]);

  // x scale
  let xScale = d3
    .scaleLinear()
    .domain([d3.min(bachelors), d3.max(bachelors)])
    .rangeRound([600, 860]);

  // Legend
  let g = svgContainer
    .append('g')
    .attr('class', 'key')
    .attr('id', 'legend')
    .attr('class', 'container-svg__legend')
    .attr('transform', 'translate(30, 40)');

  g.selectAll('rect')
   .data(
      color.range().map((d) => {
        d = color.invertExtent(d);
        if (d[0] === null) d[0] = xScale.domain()[0];
        if (d[1] === null) d[1] = xScale.domain()[1];
        return d;
      })
   )
   .enter()
   .append('rect')
   .attr('height', 8)
   .attr('x', (d) => {
      return xScale(d[0]);
   })
   .attr('width', (d) => {
      return d[0] && d[1] ? xScale(d[1]) - xScale(d[0]) : xScale(null);
   })
   .attr('fill', function (d) {
      return color(d[0]);
   });

  g.append('text')
   .attr('class', 'caption')
   .attr('x', xScale.range()[0])
   .attr('y', -6)
   .attr('fill', '#000')
   .attr('text-anchor', 'start')
   .attr('font-weight', 'bold');

  g.call(
    d3
      .axisBottom(xScale)
      .tickSize(13)
      .tickFormat((x) => {
      return Math.round(x) + '%';
    })
    .tickValues(color.domain())
  )
   .select('.domain')
   .remove();
  
  // Counties
  svgContainer.append('g')
              .attr('class', 'counties')
              .selectAll('path')
              .data(topojson.feature(usCounties, usCounties.objects.counties).features)
              .enter()
              .append('path')
              .attr('class', 'county')
              .attr('data-fips', d => d.id)
              .attr('data-education', (d) => {
                let result = education.filter((obj) => {
                  return obj.fips === d.id;
                });
                if (result[0]) {
                  return result[0].bachelorsOrHigher;
                }
                return 0;
              })
              .attr('fill', (d) => {
                let result = education.filter((obj) => {
                  return obj.fips === d.id;
                });
                if (result[0]) {
                  return color(result[0].bachelorsOrHigher);
                }
              })
              .attr('d', path)
              // Tooltip
              .on('mouseover', (event, d) => {
                tooltip.transition()
                       .duration(200)
                       .style('opacity', 0.9);
                tooltip
                  .html(() => {
                    let result = education.filter((obj) => {
                      return obj.fips === d.id;
                    });
                    if (result[0]) {
                      return (
                        result[0]['area_name'] +
                        ', ' +
                        result[0]['state'] +
                        ': ' +
                        result[0].bachelorsOrHigher +
                        '%'
                      );
                    }
                    return 0;
                  })
                  .attr('data-education', () => {
                    let result = education.filter((obj) => {
                      return obj.fips === d.id;
                    });
                    if (result[0]) {
                      return result[0].bachelorsOrHigher;
                    }
                    return 0;
                  })
              })
              .on('mouseout', () => {
                tooltip.transition()
                       .duration(200)
                       .style('opacity', 0);
    });
}
