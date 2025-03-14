// DotMap.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const DotMap = ({ data, selectedYear, theme }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear existing SVG content
    d3.select(ref.current).selectAll("*").remove();

    // Filter data by selectedYear
    const filteredData = selectedYear === "All"
      ? data
      : data.filter(d => new Date(d.incident_date).getFullYear() === +selectedYear);

    // Group by state_name
    const stateData = filteredData.filter(d => d.state_name);
    let groupedData = d3.rollups(
      stateData,
      v => v.length,
      d => d.state_name
    ).map(([state, count]) => ({ state, count }));

    // Sort descending
    groupedData = groupedData.sort((a, b) => b.count - a.count);

    // Chart dimensions with extra left margin for longer labels
    const margin = { top: 20, right: 20, bottom: 30, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3.scaleLinear()
      .domain([0, d3.max(groupedData, d => d.count)]).nice()
      .range([0, width]);

    // Y scale
    const y = d3.scaleBand()
      .domain(groupedData.map(d => d.state))
      .range([0, height])
      .padding(0.5);

    // Create a tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "dotmap-tooltip")
      .style("position", "absolute")
      .style("background", theme?.filterBackground || "#333")
      .style("color", theme?.filterColor || "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Bars
    svg.selectAll(".bar")
      .data(groupedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.state))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.count))
      .attr("fill", theme?.primary || "#39ff14")
      .on("mouseover", (event, d) => {
        tooltip.html(`<strong>${d.state}</strong>: ${d.count} incidents`)
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

    // Count labels
    svg.selectAll(".label")
      .data(groupedData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", d => y(d.state) + y.bandwidth() / 2 + 5)
      .attr("x", d => x(d.count) + 5)
      .text(d => d.count)
      .attr("fill", "#ffffff")
      .style("font-size", "10px");

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(
        d3.axisBottom(x).ticks(6)
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", theme?.axis || "#c0c7c9");

    // Y-axis
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", "10px")
      .style("fill", theme?.axis || "#c0c7c9");

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, selectedYear, theme]);

  return <svg ref={ref}></svg>;
};

export default DotMap;
