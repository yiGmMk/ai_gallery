const dynamicChartConfigs = [
  {
    id: 'population-growth',
    dataFile: 'life-expectancy-table.json',
    downloadUrl: 'https://games.programnotes.cn/life-expectancy-table.json',
    columns: {
      time: 'Year',
      type: 'Country',
      value: 'Population'
    },
    publishedDate: "2024-10-01T02:00:00.000Z",
    updatedDate: "2024-10-03T09:00:00.000Z",
    dataSource: "Echarts",
    max: -1,
  },
  {
    id: 'income-growth',
    dataFile: 'life-expectancy-table.json',
    downloadUrl: 'https://games.programnotes.cn/life-expectancy-table.json',
    columns: {
      time: 'Year',
      type: 'Country',
      value: 'Income'
    },
    publishedDate: "2024-10-01T02:00:00.000Z",
    updatedDate: "2024-10-03T09:00:00.000Z",
    dataSource: "Echarts",
    max: -1,
  },
  {
    id: 'china_gdp',
    dataFile: 'china_gdp.csv',
    downloadUrl: 'https://games.programnotes.cn/china_gdp.csv',
    columns: {
      time: 'Year',
      type: 'Region',
      value: 'GDP'
    },
    publishedDate: "2024-10-06T02:00:00.000Z",
    updatedDate: "2024-10-06T09:00:00.000Z",
    dataSource: "NationalData",
    max: -1,
    yearInterval: 1000
  },
  {
    id: 'china_population',
    dataFile: 'china_population.csv',
    downloadUrl: 'https://games.programnotes.cn/china_population.csv',
    columns: {
      time: '年份',
      type: '省份',
      value: '人口数量'
    },
    publishedDate: "2024-10-08T18:00:00.000Z",
    updatedDate: "2024-10-08T20:00:00.000Z",
    dataSource: "NationalData",
    max: -1,
    yearInterval: 1000
  },
  {
    id: 'china_income',
    dataFile: 'china_income.csv',
    downloadUrl: 'https://games.programnotes.cn/china_income.csv',
    columns: {
      time: '年份',
      type: '省份',
      value: '财政收入'
    },
    publishedDate: "2024-10-09T18:00:00.000Z",
    updatedDate: "2024-10-09T20:00:00.000Z",
    dataSource: "NationalData",
    max: -1,
    yearInterval: 1000
  },
  {
    id: 'china_outcome',
    dataFile: 'china_outcome.csv',
    downloadUrl: 'https://games.programnotes.cn/china_outcome.csv',
    columns: {
      time: '年份',
      type: '省份',
      value: '财政支出'
    },
    publishedDate: "2024-10-09T18:00:00.000Z",
    updatedDate: "2024-10-09T20:00:00.000Z",
    dataSource: "NationalData",
    max: -1,
    yearInterval: 1000
  },
];

module.exports = { dynamicChartConfigs };
