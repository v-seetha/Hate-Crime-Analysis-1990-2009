// StackedBarChart.js
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const StackedBarChart = ({ data, selectedYear, theme }) => {
  const ref = useRef();

  // Add state for region filter. "All" shows the stacked chart; a specific region shows normal chart.
  const [regionFilter, setRegionFilter] = useState("All");

  // Compute unique regions from data for the dropdown filter.
  const uniqueRegions = Array.from(
    new Set(
      data
        .filter(d => d.region_name)
        .map(d => d.region_name)
    )
  ).sort();

  useEffect(() => {
    if (!data || data.length === 0) return;
    d3.select(ref.current).selectAll("*").remove();

    // Filter data by selectedYear
    const filteredData =
      selectedYear === "All"
        ? data
        : data.filter(
            d => new Date(d.incident_date).getFullYear() === +selectedYear
          );

    // Filter data for valid region_name and bias_desc
    const withRegion = filteredData.filter(d => d.region_name && d.bias_desc);

    // Set margins and dimensions
    const margin = { top: 30, right: 20, bottom: 70, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3
      .select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip configuration
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "stacked-tooltip")
      .style("position", "absolute")
      .style("background", theme?.filterBackground || "#333")
      .style("color", theme?.filterColor || "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    if (regionFilter === "All") {
      // --- Stacked Bar Chart for All Regions ---

      // Roll up the data by region and bias
      const nested = d3.rollups(
        withRegion,
        v => v.length,
        d => d.region_name,
        d => d.bias_desc
      );
      const dataForStack = [];
      const biasSet = new Set();
      nested.forEach(([region, biasArr]) => {
        const rowObj = { region };
        biasArr.forEach(([bias, count]) => {
          rowObj[bias] = count;
          biasSet.add(bias);
        });
        dataForStack.push(rowObj);
      });
      const biases = Array.from(biasSet);

      // X scale for regions
      const x = d3
        .scaleBand()
        .domain(dataForStack.map(d => d.region))
        .range([0, width])
        .padding(0.2);

      // Create stack layout
      const stack = d3.stack().keys(biases);
      const series = stack(dataForStack);

      // Y scale based on maximum stacked value
      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(series, layer => d3.max(layer, d => d[1]))
        ])
        .nice()
        .range([height, 0]);

      // Color scale for biases
      const color = d3.scaleOrdinal(d3.schemeSet2).domain(biases);

      // Draw the stacked bars
      svg
        .selectAll("g.layer")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .attr("class", "layer")
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.region))
        .attr("y", d => y(d[1]))
        .attr("height", d => Math.abs(y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth())
        .on("mouseover", (event, d) => {
          const bias = d3.select(event.currentTarget.parentNode).datum().key;
          const count = d.data[bias] || 0;
          tooltip
            .html(
              `<strong>${d.data.region}</strong><br/><strong>${bias}</strong>: ${count}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });

      // X-axis
      svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", theme?.axis || "#c0c7c9")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-30)");

      // Y-axis
      const yAxis = svg.append("g").call(d3.axisLeft(y));
      yAxis.selectAll("text")
        .style("font-size", "12px")
        .style("fill", theme?.axis || "#c0c7c9");
    } else {
      // --- Normal Bar Chart for Selected Region ---
      // Filter data to the selected region
      const regionData = withRegion.filter(
        d => d.region_name === regionFilter
      );

      // Roll up data by bias only
      const biasMap = d3.rollup(
        regionData,
        v => v.length,
        d => d.bias_desc
      );
      const dataForBias = Array.from(biasMap, ([bias, count]) => ({
        bias,
        count
      }));

      // X scale for biases
      const x = d3
        .scaleBand()
        .domain(dataForBias.map(d => d.bias))
        .range([0, width])
        .padding(0.2);

      // Y scale based on counts
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(dataForBias, d => d.count)])
        .nice()
        .range([height, 0]);

      // Draw bars for each bias
      svg
        .selectAll("rect.normal")
        .data(dataForBias)
        .enter()
        .append("rect")
        .attr("class", "normal")
        .attr("x", d => x(d.bias))
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count))
        .attr("width", x.bandwidth())
        .attr("fill", theme?.barColor || "steelblue")
        .on("mouseover", (event, d) => {
          tooltip
            .html(
              `<strong>${regionFilter}</strong><br/><strong>${d.bias}</strong>: ${d.count}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });

      // X-axis for biases
      svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", theme?.axis || "#c0c7c9")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-30)");

      // Y-axis for counts
      const yAxis = svg.append("g").call(d3.axisLeft(y));
      yAxis.selectAll("text")
        .style("font-size", "12px")
        .style("fill", theme?.axis || "#c0c7c9");
    }

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, selectedYear, theme, regionFilter]);

  return (
    <div>
      {/* Region Filter Control */}
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="regionFilter" style={{ marginRight: "10px" }}>
          Select Region:
        </label>
        <select
          id="regionFilter"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        >
          <option value="All">All Regions</option>
          {uniqueRegions.map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default StackedBarChart;
