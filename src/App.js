import React, { useEffect, useState } from "react";
import * as d3 from "d3";

import TimeSeriesChart from "./TimeSeriesChart";
import GeoMap from "./GeoMap";
import PieChart from "./PieChart";
import StackedBarChart from "./StackedBarChart";
import GroupedBarChart from "./GroupedBarChart";
import DotMap from "./DotMap";
import HeatMap from "./HeatMap";

import "./App.css";

// Theme mapping for "All" and for each year from 1990 to 2009.
const themeMapping = {
  "All": {
    filterBackground: "#333",
    filterColor: "#fff",
    primary: "#39ff14",
    secondary: "#10ffd6",
    background: "#131A1F",
    axis: "#c0c7c9"
  },
  1990: {
    filterBackground: "#1a1a1a",
    filterColor: "#ffffff",
    primary: "#ff5733",
    secondary: "#c70039",
    background: "#900c3f",
    axis: "#f0e68c"
  },
  1991: {
    filterBackground: "#2e2e2e",
    filterColor: "#fefefe",
    primary: "#33ff57",
    secondary: "#39c700",
    background: "#0c903f",
    axis: "#ffe680"
  },
  1992: {
    filterBackground: "#3e3e3e",
    filterColor: "#efefef",
    primary: "#3357ff",
    secondary: "#0039c7",
    background: "#0c3f90",
    axis: "#c0c700"
  },
  1993: {
    filterBackground: "#4a4a4a",
    filterColor: "#fafafa",
    primary: "#ff33a8",
    secondary: "#c7008a",
    background: "#900c5f",
    axis: "#e6e600"
  },
  1994: {
    filterBackground: "#5a5a5a",
    filterColor: "#fdfdfd",
    primary: "#33fff5",
    secondary: "#00c7c7",
    background: "#0c9f90",
    axis: "#c0f0e6"
  },
  1995: {
    filterBackground: "#6a6a6a",
    filterColor: "#ffffff",
    primary: "#ff9a33",
    secondary: "#c76a00",
    background: "#905f0c",
    axis: "#f0c0a6"
  },
  1996: {
    filterBackground: "#7a7a7a",
    filterColor: "#eeeeee",
    primary: "#9d33ff",
    secondary: "#6a00c7",
    background: "#5f0c90",
    axis: "#e6c0f0"
  },
  1997: {
    filterBackground: "#8a8a8a",
    filterColor: "#dddddd",
    primary: "#33ff9a",
    secondary: "#00c76a",
    background: "#0c905f",
    axis: "#c0e6a6"
  },
  1998: {
    filterBackground: "#9a9a9a",
    filterColor: "#cccccc",
    primary: "#ff3333",
    secondary: "#c70000",
    background: "#900c0c",
    axis: "#f0a6a6"
  },
  1999: {
    filterBackground: "#aaaaaa",
    filterColor: "#bbbbbb",
    primary: "#33a8ff",
    secondary: "#007ac7",
    background: "#0c5390",
    axis: "#a6c0f0"
  },
  2000: {
    filterBackground: "#bbbbbb",
    filterColor: "#aaaaaa",
    primary: "#a833ff",
    secondary: "#7a00c7",
    background: "#5f0c90",
    axis: "#c0a6f0"
  },
  2001: {
    filterBackground: "#cccccc",
    filterColor: "#999999",
    primary: "#33ff33",
    secondary: "#00c700",
    background: "#0c900c",
    axis: "#c0f0c0"
  },
  2002: {
    filterBackground: "#dddddd",
    filterColor: "#888888",
    primary: "#ff33f5",
    secondary: "#c700d6",
    background: "#900c9f",
    axis: "#f0c0f0"
  },
  2003: {
    filterBackground: "#eeeeee",
    filterColor: "#777777",
    primary: "#33f5ff",
    secondary: "#00c7f5",
    background: "#0c90f5",
    axis: "#c0f0e6"
  },
  2004: {
    filterBackground: "#fefefe",
    filterColor: "#666666",
    primary: "#ff9aff",
    secondary: "#c76aff",
    background: "#905f0c",
    axis: "#f0e6c0"
  },
  2005: {
    filterBackground: "#1f1f1f",
    filterColor: "#f1f1f1",
    primary: "#33ffcc",
    secondary: "#00c7a6",
    background: "#0c905f",
    axis: "#a6f0c0"
  },
  2006: {
    filterBackground: "#2f2f2f",
    filterColor: "#e1e1e1",
    primary: "#ffcc33",
    secondary: "#c7a600",
    background: "#905f0c",
    axis: "#f0d6c0"
  },
  2007: {
    filterBackground: "#3f3f3f",
    filterColor: "#d1d1d1",
    primary: "#33ccff",
    secondary: "#007ac7",
    background: "#0c5390",
    axis: "#a6c0f0"
  },
  2008: {
    filterBackground: "#4f4f4f",
    filterColor: "#c1c1c1",
    primary: "#cc33ff",
    secondary: "#a600c7",
    background: "#5f0c90",
    axis: "#f0a6c0"
  },
  2009: {
    filterBackground: "#5f5f5f",
    filterColor: "#b1b1b1",
    primary: "#ff5733",
    secondary: "#c70039",
    background: "#900c3f",
    axis: "#f0e68c"
  }
};

const App = () => {
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("All");

  useEffect(() => {
    d3.csv("/cleaned_hatecrime_data.csv").then(loadedData => {
      setData(loadedData);
    });
  }, []);

  // Derive unique years from data.
  const years = Array.from(
    new Set(data.map(d => new Date(d.incident_date).getFullYear()))
  ).sort((a, b) => a - b);

  // Determine the active theme. Fall back to the "All" theme if a year theme is not defined.
  const activeTheme = themeMapping[selectedYear] || themeMapping["All"];

  return (
    <div className="app" style={{ backgroundColor: activeTheme.background }}>
      <h1 style={{ color: activeTheme.primary }}>Hate Crime Data Visualization</h1>
      <div className="year-filter">
        <label
          style={{
            marginRight: "8px",
            color: activeTheme.axis,
            fontSize: "14px"
          }}
        >
          Year:
        </label>
        <select
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "14px",
            border: "1px solid #ccc",
            backgroundColor: activeTheme.filterBackground,
            color: activeTheme.filterColor
          }}
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          <option value="All">All</option>
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="dashboard">
  <div className="chart-item">
  <div className="chart-question">
      Which geographical areas report the highest occurrence of hate crimes?
    </div>
    <GeoMap data={data} selectedYear={selectedYear} theme={activeTheme} />
  </div>
  <div className="chart-item">
  <div className="chart-question">
      How are hate crimes distributed across different regions?
    </div>
    <DotMap data={data} selectedYear={selectedYear} theme={activeTheme} />
    
  </div>
  <div className="chart-item">
  <div className="chart-question">
      What is the proportion of hate crime types across the dataset?
    </div>
    <PieChart data={data} selectedYear={selectedYear} theme={activeTheme} />
  </div>
  <div className="chart-item">
  <div className="chart-question">
      How do hate crime incidents vary by region and bias description?
    </div>
    <StackedBarChart data={data} selectedYear={selectedYear} theme={activeTheme} />
  </div>
  <div className="chart-item">
  <div className="chart-question">
      How do hate crime counts compare across different regions?
    </div>
    <GroupedBarChart data={data} selectedYear={selectedYear} theme={activeTheme} />
    
  </div>
  <div className="chart-item">
  <div className="chart-question">
      What are the trends in hate crime occurrences over time?
    </div>
    <TimeSeriesChart data={data} selectedYear={selectedYear} theme={activeTheme} />
    
  </div>

          <div className="chart-item">
          <div className="chart-question">
              Which days and months have the highest hate crime counts?
            </div>
            <HeatMap data={data} selectedYear={selectedYear} theme={activeTheme} />
            
          </div>
        </div>
        </div>
  );
};

export default App;
