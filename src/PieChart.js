// PieChart.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const PieChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.length) return;

    // Filter rows that have a defined bias_desc
    const filteredData = data.filter(d => d.bias_desc);

    // Group by bias_desc and compute counts
    let groupedData = d3.rollups(
      filteredData,
      v => v.length,
      d => d.bias_desc
    ).map(([bias, count]) => ({ bias, count }));

    // Sort by count (descending) and keep only the top 15
    groupedData = groupedData
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Remove any existing elements from the SVG
    d3.select(ref.current).selectAll("*").remove();

    // Dimensions for the pie chart
    const width = 500;
    const height = 500;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    // Create the SVG container and translate the group to the center
    const svg = d3.select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create a linear color scale mapping count -> [0, 1]
    // so that the maximum count maps to 1 (dark green)
    // and the minimum maps to 0 (light green).
    const minCount = d3.min(groupedData, d => d.count);
    const maxCount = d3.max(groupedData, d => d.count);
    const colorScale = d3.scaleLinear()
      .domain([minCount, maxCount])
      .range([0, 1]);

    // Generate the pie layout
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const data_ready = pie(groupedData);

    // Define the arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Create a tooltip element (appended to the body)
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Build the pie chart: append one path per slice
    svg.selectAll("path")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => d3.interpolateGreens(colorScale(d.data.count)))
      .attr("stroke", "#ffffff")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).style("opacity", 1);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${d.data.bias}</strong><br/>Count: ${d.data.count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).style("opacity", 0.8);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Add labels to each slice and rotate them based on slice angle
    svg.selectAll("text")
      .data(data_ready)
      .enter()
      .append("text")
      .attr("transform", d => {
        const [x, y] = arc.centroid(d);
        // Calculate the mid-angle in degrees
        const midAngle = (d.startAngle + d.endAngle) / 2;
        let rotate = midAngle * 180 / Math.PI - 90;
        // Flip text if rotated more than 90 degrees
        if (rotate > 90) rotate = rotate - 180;
        return `translate(${x}, ${y}) rotate(${rotate})`;
      })
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#ffffff")
      .text(d => d.data.count);

    // Clean up tooltip on unmount
    return () => {
      tooltip.remove();
    };

  }, [data]);

  return <svg ref={ref}></svg>;
};

export default PieChart;
