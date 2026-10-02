'use client'; 
import React from 'react'; import { Radar } from 'react-chartjs-2'; 
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,ChartOptions, } from 'chart.js'; 
// Register necessary components 
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend); 
// // Type for your component props 
interface SpiderChartProps { chartData: { labels: string[]; data: number[]; }; title: string; } // Helper function to format axis labels 
const formatName = (label: string) => { 
  if (!label) return ''; if (label === 'Emotional Stability') return 'Neuroticism'; 
  if (label === 'HonestyHumility') return 'Honesty-Humility'; 
  if (label === 'LogicalMathematical') return 'Logical-Math'; 
  if (label === 'BodilyKinesthetic') return 'Bodily-Kin.'; 
  const result = label.replace(/([A-Z])/g, ' $1'); 
  if (result.includes(' ') || label.toUpperCase() === label) 
    return label; 
  return result.charAt(0).toUpperCase() + result.slice(1); 
}; 
  // 🛠 Use the proper prop type 
  const SpiderChart: React.FC<SpiderChartProps> = ({ chartData, title }) => { 
    // const chartRef = useRef(null); 
    if (!chartData || !chartData.labels || !chartData.data) 
    { return <p>Missing chart data for {title}.</p>; } 
    const data = { labels: chartData.labels, 
      datasets: [{ label: title, data: chartData.data, 
      backgroundColor: 'rgba(54, 162, 235, 0.2)', 
      borderColor: 'rgba(54, 162, 235, 1)', 
      pointBackgroundColor: 'rgba(54, 162, 235, 1)', 
      pointBorderColor: '#fff', 
      pointHoverBackgroundColor: '#fff', 
      pointHoverBorderColor: 'rgba(54, 162, 235, 1)', }], }; 
      
      const options: ChartOptions<'radar'> = { 
      devicePixelRatio: 2,
      responsive: true, 
      maintainAspectRatio: true, scales: {
  r: {
    angleLines: { display: true, color: "rgba(0,0,0,0.1)" },
    suggestedMin: 1,
    suggestedMax: 5,

    ticks: {
      stepSize: 1,
      backdropColor: "rgba(255,255,255,0.75)",
      font: { size: 9 }
    },

    pointLabels: {
      font: { size: 10 },
      padding: 3,  // prevents clipping
      callback: function (label: string) {
        return formatName(label);
      }
    },

    grid: { color: "rgba(0,0,0,0.1)" }
  }
},

      plugins: { legend: { display: false }, 
      tooltip: { callbacks: 
        { 
          label: function (context) 
          { 
            let label = formatName(data.labels?.[context.dataIndex]) || ''; 
        if (label) label += ': '; 
        if (context.parsed.r !== null) label += context.parsed.r.toFixed(2); 
        return label; 
      }, 
      }, }, }, }; 
        return ( 
        <div className="bigfive-chart-container "> 
        <h1 className='mt-2'>BIG FIVE/OCEAN PROFILE</h1> 
        <div className="bigfive-chart"> 
          <Radar data={data} options={options} /> 
        </div> 
        </div> 
        ); };
        export default SpiderChart;

// import React, { useRef } from 'react';
// import { Radar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   RadialLinearScale,
//   PointElement,
//   LineElement,
//   Filler,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// // Register necessary Chart.js components
// ChartJS.register( RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend );

// // Helper to format names
// const formatName = (label:any) => {
//     if (!label) return '';
//     if (label === 'Emotional Stability') return 'Em. Stability';
//     if (label === 'HonestyHumility') return 'Honesty-Humility';
//     if (label === 'LogicalMathematical') return 'Logical-Math';
//     if (label === 'BodilyKinesthetic') return 'Bodily-Kin.';
//      const result = label.replace(/([A-Z])/g, ' $1');
//      if (result.includes(' ') || label.toUpperCase() === label) {
//          return label;
//      }
//     return result.charAt(0).toUpperCase() + result.slice(1);
// };

// // Removed onTraitHover prop
// const SpiderChart = ({ chartData, title }) => {
//   const chartRef = useRef(null);

//   if (!chartData || !chartData.labels || !chartData.data) {
//     return <p>Missing chart data for {title}.</p>;
//   }

//   const data = {
//     labels: chartData.labels,
//     datasets: [ {
//         label: title, data: chartData.data, backgroundColor: 'rgba(54, 162, 235, 0.2)',
//         borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1.5, pointBackgroundColor: 'rgba(54, 162, 235, 1)',
//         pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
//       }, ],
//   };

//   const options = {
//     scales: { r: {
//         angleLines: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
//         suggestedMin: 1, suggestedMax: 5,
//         ticks: { stepSize: 1, backdropColor: 'rgba(255, 255, 255, 0.75)', font: { size: 10 } },
//         pointLabels: {
//              font: { size: 11 },
//              callback: function(label:any) { return formatName(label); }
//             },
//         grid: { color: 'rgba(0, 0, 0, 0.1)' }
//       }, },
//     plugins: {
//       legend: { display: false },
//        tooltip: { callbacks: {
//             label: function(context:any) {
//               let label = formatName(data.labels[context.dataIndex]) || '';
//               if (label) { label += ': '; }
//               if (context.parsed.r !== null) { label += context.parsed.r.toFixed(2); }
//               return label;
//             }
//           } } },
//     maintainAspectRatio: true,
//     responsive: true,
//     // *** REMOVED onHover and interaction options ***
//   };

//   return (
//       <div className="chart-container">
//         <h4>{title}</h4>
//          <Radar ref={chartRef} data={data} options={options} />
//       </div>
//   );
// };

// export default SpiderChart;