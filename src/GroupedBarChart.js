// GroupedBarChart.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const GroupedBarChart = ({ data, selectedYear, theme }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    d3.select(ref.current).selectAll("*").remove();

    // Filter by year
    const filteredData = selectedYear === "All"
      ? data
      : data.filter(d => new Date(d.incident_date).getFullYear() === +selectedYear);

    const fields = ["victim_count", "adult_victim_count", "juvenile_victim_count", "total_offender_count"];

    const aggregatedDataMap = d3.rollup(
      filteredData,
      rows => {
        const result = {};
        fields.forEach(field => {
          result[field] = d3.sum(rows, r => +r[field]);
        });
        return result;
      },
      d => d.offense_name
    );

    let aggregatedData = Array.from(aggregatedDataMap, ([offense, sums]) => ({
      offense,
      ...sums
    }));

    aggregatedData = aggregatedData
      .sort((a, b) => b.victim_count - a.victim_count)
      .slice(0, 15);

    // Dimensions
    const margin = { top: 30, right: 20, bottom: 70, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(aggregatedData.map(d => d.offense))
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(fields)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const maxVal = d3.max(aggregatedData, d => d3.max(fields, key => d[key]));
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([height, 0]);

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "grouped-tooltip")
      .style("position", "absolute")
      .style("background", theme?.filterBackground || "#333")
      .style("color", theme?.filterColor || "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    const color = d3.scaleOrdinal(d3.schemeSet2).domain(fields);

    svg.selectAll("g.offense")
      .data(aggregatedData)
      .enter()
      .append("g")
      .attr("class", "offense")
      .attr("transform", d => `translate(${x0(d.offense)}, 0)`)
      .selectAll("rect")
      .data(d => fields.map(key => ({ key, value: d[key] })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key))
      .on("mouseover", (event, d) => {
        tooltip.html(`<strong>${d.key}</strong>: ${d.value}`)
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

    // X-axis with rotated labels
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("font-size", "9px")
      .style("fill", theme?.axis || "#c0c7c9")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    // Y-axis
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y));
    yAxis.selectAll("text")
      .style("font-size", "12px")
      .style("fill", theme?.axis || "#c0c7c9");

    return () => {
      tooltip.remove();
    };
  }, [data, selectedYear, theme]);

  return <svg ref={ref}></svg>;
};

export default GroupedBarChart;
