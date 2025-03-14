// GeoMap.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const fipsToAbbr = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY"
};

const GeoMap = ({ data, selectedYear }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    d3.select(ref.current).selectAll("*").remove();

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "geomap-tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Filter data by selectedYear if not "All"
    const filteredData = selectedYear === "All" 
      ? data 
      : data.filter(d => new Date(d.incident_date).getFullYear() === +selectedYear);

    // Rollup counts by state abbreviation.
    const stateCounts = d3.rollup(
      filteredData,
      v => v.length,
      d => d.state_abbr
    );
    const maxCount = d3.max(Array.from(stateCounts.values())) || 0;
    const color = d3.scaleLinear()
      .domain([0, maxCount])
      .range(["#000000", "#39FF14"]);

    const width = 800, height = 600;
    const svg = d3.select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#131A1F");

    // Load US states TopoJSON and render states.
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(topoData => {
        const geoData = feature(topoData, topoData.objects.states);

        // Draw each state.
        const projection = d3.geoAlbersUsa().fitSize([width, height], geoData);
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
          .data(geoData.features)
          .enter()
          .append("path")
            .attr("d", path)
            .attr("stroke", "#131A1F")
            .attr("stroke-width", 1)
            .attr("fill", d => {
              const abbr = fipsToAbbr[d.id];
              const count = stateCounts.get(abbr) || 0;
              return color(count);
            })
          .on("mouseover", (event, d) => {
            const abbr = fipsToAbbr[d.id];
            const count = stateCounts.get(abbr) || 0;
            tooltip.html(`<strong>${abbr}</strong>: ${count} incidents`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px")
              .transition().duration(200).style("opacity", 0.9);
          })
          .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
          });

        // Add state abbreviation labels at the centroid of each state.
        svg.selectAll("text.state-label")
          .data(geoData.features)
          .enter()
          .append("text")
          .attr("class", "state-label")
          .attr("transform", d => {
            const centroid = path.centroid(d);
            return `translate(${centroid[0]},${centroid[1]})`;
          })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .attr("fill", "#ffffff")
          .attr("font-size", "10px")
          .text(d => fipsToAbbr[d.id]);

        // ---- Add Legend ----
        // Append a defs element to hold the gradient.
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "legend-gradient")
          .attr("x1", "0%")
          .attr("x2", "0%")
          .attr("y1", "100%")
          .attr("y2", "0%");
        
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", color(0));
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", color(maxCount));

        // Create a group for the legend.
        const legendWidth = 20;
        const legendHeight = 50;
        const legendX = width - 70; // adjust x position as needed
        const legendY = 50;         // adjust y position as needed

        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${legendX}, ${legendY})`);

        // Draw the legend rect.
        legend.append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)");

        // Create a scale for the legend axis.
        const legendScale = d3.scaleLinear()
          .domain([0, maxCount])
          .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
          .ticks(5)
          .tickSize(5);

        legend.append("g")
          .attr("class", "legend-axis")
          .attr("transform", `translate(${legendWidth}, 0)`)
          .call(legendAxis)
          .selectAll("text")
          .attr("fill", "#c0c7c9")
          .attr("font-size", "10px");

      })
      .catch(error => console.error("Error loading TopoJSON:", error));

    return () => {
      tooltip.remove();
    };
  }, [data, selectedYear]);

  return <svg ref={ref}></svg>;
};

export default GeoMap;
