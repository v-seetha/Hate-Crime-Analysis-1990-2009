// HeatMap.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const HeatMap = ({ data, selectedYear }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    d3.select(ref.current).selectAll("*").remove();

    // Tooltip for the heat map
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "heatmap-tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Filter data based on selectedYear.
    const filteredData =
      selectedYear === "All"
        ? data
        : data.filter(
            d => new Date(d.incident_date).getFullYear() === +selectedYear
          );

    const parseDate = d3.timeParse("%Y-%m-%d");
    // Create a Map where key is "month-day" (month: 0-11, day: 0-6) and value is count.
    const map = new Map();
    filteredData.forEach(row => {
      const d = parseDate(row.incident_date);
      if (d) {
        const month = d.getMonth(); // 0 to 11
        const day = d.getDay();     // 0 (Sun) to 6 (Sat)
        const key = `${month}-${day}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    });

    const heatData = [];
    for (let [key, count] of map.entries()) {
      const [m, day] = key.split("-").map(Number);
      heatData.push({ month: m, day, count });
    }

    const margin = { top: 40, right: 80, bottom: 5, left: 60 };
    const cellSize = 40;  // Increased cell size.
    const width = 12 * cellSize;
    const height = 7 * cellSize;

    // Create the main SVG container.
    const svg = d3
      .select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Group for the heat map cells and labels.
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X and Y scales for months and days.
    const x = d3.scaleBand()
      .domain(d3.range(12))
      .range([0, 12 * cellSize]);
    const y = d3.scaleBand()
      .domain(d3.range(7))
      .range([0, 7 * cellSize]);

    const maxCount = d3.max(heatData, d => d.count);

    // Reversed Greens scale: low counts yield dark green, high counts yield light green.
    const color = d3.scaleSequential(t => d3.interpolateGreens(1 - t))
      .domain([0, maxCount]);

    // Create cells.
    g.selectAll(".cell")
      .data(heatData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => x(d.month))
      .attr("y", d => y(d.day))
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", d => color(d.count))
      .on("mouseover", (event, d) => {
        const monthName = d3.timeFormat("%B")(new Date(2000, d.month));
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        tooltip.html(`<strong>${monthName} - ${dayNames[d.day]}</strong><br/>Count: ${d.count}`)
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

    // Add count labels inside each cell.
    g.selectAll(".cell-label")
      .data(heatData)
      .enter()
      .append("text")
      .attr("class", "cell-label")
      .attr("x", d => x(d.month) + cellSize / 2)
      .attr("y", d => y(d.day) + cellSize / 2)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", d => d.count > maxCount / 2 ? "#000" : "#fff")
      .text(d => d.count);

    // Month labels (top).
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    g.selectAll(".month-label")
      .data(monthNames)
      .enter()
      .append("text")
      .attr("class", "month-label")
      .attr("x", (_, i) => x(i) + cellSize / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#c0c7c9")
      .text(d => d);

    // Day labels (left side).
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    g.selectAll(".day-label")
      .data(dayNames)
      .enter()
      .append("text")
      .attr("class", "day-label")
      .attr("x", -5)
      .attr("y", (_, i) => y(i) + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("fill", "#c0c7c9")
      .text(d => d);

    // ---- Add Legend ----
    const legendWidth = 20;
    const legendHeight = height;  // same as heat map height

    // Define a linear gradient for the legend.
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
      
    // Append the legend group and position it to the right of the heat map.
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);
      
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");
      
    // Create a scale for the legend axis.
    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([legendHeight, 0]);
      
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5);
      
    legend.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#c0c7c9");

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };

  }, [data, selectedYear]);

  return (
    <div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default HeatMap;
