// TimeSeriesChart.js
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TimeSeriesChart = ({ data }) => {
  const ref = useRef();

  // Fixed year range: from 1991 to 2009
  const fixedYears = Array.from({ length: 2009 - 1991 + 1 }, (_, i) => 1991 + i);
  const [selectedYear, setSelectedYear] = useState(fixedYears[0]);

  useEffect(() => {
    if (!data || !data.length || !selectedYear) return;

    // Clear previous content
    d3.select(ref.current).selectAll("*").remove();

    // Parse the incident_date string into Date objects
    const parseDate = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%Y-%m-%d");

    // Filter data for the selected year and group by date
    let grouped = d3.rollups(
      data.filter(d => new Date(d.incident_date).getFullYear() === selectedYear),
      v => v.length,
      d => d.incident_date
    ).map(([dateStr, count]) => ({
      date: parseDate(dateStr),
      count,
    }));

    // Create a lookup map from date string to count
    const groupedMap = new Map(grouped.map(d => [formatDate(d.date), d.count]));

    // Define start and end of the selected year
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);
    // Generate complete list of dates for the year
    const allDates = d3.timeDay.range(startOfYear, d3.timeDay.offset(endOfYear, 1));

    // Build full data: assign count = 0 if no incident on that date
    const fullData = allDates.map(date => ({
      date,
      count: groupedMap.get(formatDate(date)) || 0
    }));

    // Ensure data is sorted by date
    fullData.sort((a, b) => a.date - b.date);

    // Set up chart dimensions
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };
    const width = 700 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Create the SVG container and group element
    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales for x (time) and y (count)
    const x = d3.scaleTime()
      .domain([startOfYear, endOfYear])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(fullData, d => d.count)]).nice()
      .range([height, 0]);

    // Define the main line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count));

    // Draw the main time series line in dark green
    svg.append("path")
      .datum(fullData)
      .attr("fill", "none")
      .attr("stroke", "#004d00") // Dark green
      .attr("stroke-width", 2)
      .attr("d", line);

    // Compute a trend line (simple linear regression) over fullData
    const n = fullData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    fullData.forEach(d => {
      const xVal = d.date.getTime();
      sumX += xVal;
      sumY += d.count;
      sumXY += xVal * d.count;
      sumXX += xVal * xVal;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const trendLineData = [
      { date: startOfYear, count: slope * startOfYear.getTime() + intercept },
      { date: endOfYear, count: slope * endOfYear.getTime() + intercept }
    ];

    // Draw the trend line in neon green, dashed
    svg.append("path")
      .datum(trendLineData)
      .attr("fill", "none")
      .attr("stroke", "#39ff14")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 2")
      .attr("d", d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
      );

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));
    svg.append("g").call(d3.axisLeft(y));

    // Interactive overlay: vertical guideline and tooltip
    const bisectDate = d3.bisector(d => d.date).left;
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("font-size", "12px");

    const focusLine = svg.append("line")
      .attr("stroke", "#39ff14")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3")
      .style("opacity", 0);

    // Overlay rectangle to capture mouse events
    svg.append("rect")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", () => {
        focusLine.style("opacity", 1);
        tooltip.style("opacity", 1);
      })
      .on("mousemove", (event) => {
        const mouseX = d3.pointer(event)[0];
        const x0 = x.invert(mouseX);
        let i = bisectDate(fullData, x0, 1);
        if (i <= 0) i = 1;
        if (i >= fullData.length) i = fullData.length - 1;
        const d0 = fullData[i - 1];
        const d1 = fullData[i];
        const d = (x0 - d0.date > d1.date - x0) ? d1 : d0;
        focusLine.attr("x1", x(d.date))
          .attr("x2", x(d.date))
          .attr("y1", 0)
          .attr("y2", height);
        tooltip.html(`<strong>${d3.timeFormat("%Y-%m-%d")(d.date)}</strong><br/>Count: ${d.count}`)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        focusLine.style("opacity", 0);
        tooltip.style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };

  }, [data, selectedYear]);

  return (
    <div>
      <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
        <label 
          htmlFor="year-select" 
          style={{ color: "#fff", marginRight: "8px", fontSize: "14px" }}
        >
          Select Year:
        </label>
        <select
          id="year-select"
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "14px",
            border: "1px solid #ccc",
            backgroundColor: "#333",
            color: "#fff"
          }}
          onChange={(e) => setSelectedYear(+e.target.value)}
          value={selectedYear || ""}
        >
          {fixedYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <svg ref={ref}></svg>
    </div>
  );
};

export default TimeSeriesChart;
