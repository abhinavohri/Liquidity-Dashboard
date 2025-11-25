import { useState, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { TimeSeriesData, TimeFilter } from '../../types';
import { ChartSkeleton } from '../common/SkeletonLoader';
import { formatUsdPlain } from '../../utils/formatters';

interface MetricsChartProps {
  data: TimeSeriesData[];
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  isLoading?: boolean;
}

type MetricType = 'latency' | 'bonus';

function MetricsChart({
  data,
  timeFilter,
  onTimeFilterChange,
  isLoading = false,
}: MetricsChartProps) {
  const [metricType, setMetricType] = useState<MetricType>('latency');

  if (isLoading) {
    return <ChartSkeleton />;
  }

  const config = useMemo(() => {
    switch (metricType) {
      case 'latency':
        return {
          title: 'Liquidation Latency Over Time',
          subtitle: 'Average time from health factor < 1.0 to liquidation',
          yAxisName: 'Seconds',
          color: '#00bcd4',
          data: data.map(d => d.avgLatency),
          formatter: (value: number) => `${value.toFixed(1)}s`,
        };
      case 'bonus':
        return {
          title: 'Daily Liquidator Profit',
          subtitle: 'Total profit earned by liquidators per day',
          yAxisName: 'USD',
          color: '#4caf50',
          data: data.map(d => d.totalBonus),
          formatter: formatUsdPlain,
        };
    }
  }, [metricType, data]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const point = params[0];
        const date = new Date(point.name).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const value = config.formatter(point.value);
        const count = data.find(d => d.date === point.name)?.count || 0;
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${date}</div>
          <div>${config.yAxisName}: <span style="color: ${config.color}; font-weight: 600;">${value}</span></div>
          <div>Liquidations: <span style="font-weight: 600;">${count}</span></div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        formatter: (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        },
      },
    },
    yAxis: {
      type: 'value',
      name: config.yAxisName,
      nameTextStyle: { color: 'rgba(255, 255, 255, 0.7)' },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        formatter: metricType === 'latency'
          ? (v: number) => `${v}s`
          : (v: number) => formatUsdPlain(v),
      },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
    series: [
      {
        name: config.title,
        type: 'line',
        data: config.data,
        smooth: true,
        lineStyle: { color: config.color, width: 3 },
        itemStyle: { color: config.color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${config.color}4D` },
              { offset: 1, color: `${config.color}0D` },
            ],
          },
        },
      },
    ],
  }), [data, config]);

  return (
    <Paper
      className="glass-border"
      sx={{
        padding: 2,
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ color: 'var(--color-text)', fontWeight: 600 }}>
            {config.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            {config.subtitle}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
          <ToggleButtonGroup
            value={timeFilter}
            exclusive
            onChange={(_, value) => value && onTimeFilterChange(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--border-color)',
                fontSize: '0.75rem',
                padding: '4px 12px',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 188, 212, 0.2)',
                  color: '#00bcd4',
                },
              },
            }}
          >
            <ToggleButton value="1w">1W</ToggleButton>
            <ToggleButton value="1m">1M</ToggleButton>
            <ToggleButton value="1y">1Y</ToggleButton>
            <ToggleButton value="max">Max</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={metricType}
            exclusive
            onChange={(_, value) => value && setMetricType(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--border-color)',
                fontSize: '0.75rem',
                padding: '4px 10px',
                '&.Mui-selected': {
                  backgroundColor: 'var(--color-bg-row)',
                  color: 'var(--color-text)',
                },
              },
            }}
          >
            <ToggleButton value="latency">Latency</ToggleButton>
            <ToggleButton value="bonus">Bonus</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      <ReactECharts
        option={option}
        style={{ height: '350px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </Paper>
  );
}

export default memo(MetricsChart);
