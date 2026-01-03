import React, { useState, useCallback, useEffect } from 'react';
import { Form, Button, Tabs, Table, message, Row, Col } from 'antd';
import { DatePicker, Input } from 'antd';
import ReactECharts from 'echarts-for-react';
import { timeSeriesApi } from '../utils/api.js';


const { TextArea } = Input;
const { RangePicker } = DatePicker;

function TimeSeriesDataQuery() {
  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('table');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);

  // 确保时间格式为InfluxDB支持的格式
  const ensureInfluxTimeFormat = (timeStr) => {
    if (!timeStr) return null;

    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (dateRegex.test(timeStr)) {
      return timeStr;
    }

    try {
      const date = new Date(timeStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('时间格式转换失败:', error);
      return timeStr;
    }
  };

  // 处理查询
  const handleQuery = useCallback(async (values) => {
    setLoading(true);
    try {
      // 替换SQL语句中的时间占位符
      let processedSql = values.sql;
      if (values.timeRange) {
        let startTime = values.timeRange[0];
        let endTime = values.timeRange[1];
        startTime = ensureInfluxTimeFormat(startTime);
        endTime = ensureInfluxTimeFormat(endTime);
        if (startTime) {
          processedSql = processedSql.replace(/\$\{startTime\}/g, `'${startTime}'`);
        }
        if (endTime) {
          processedSql = processedSql.replace(/\$\{endTime\}/g, `'${endTime}'`);
        }
      }

      // 调用后台API查询数据
      const response = await timeSeriesApi.queryBySql({
        sql: processedSql
      });

      // 处理返回结果
      let resultData = [];
      let fields = [];

      if (response && response.data && response.field) {
        fields = response.field;
        resultData = response.data.map(item => {
          if (Array.isArray(item)) {
            return fields.reduce((obj, field, index) => {
              obj[field] = item[index];
              return obj;
            }, {});
          }
          return item;
        });
      } else {
        resultData = Array.isArray(response) ? response : response?.data || [];
        if (resultData.length > 0 && !Array.isArray(resultData[0])) {
          fields = Object.keys(resultData[0]);
        }
      }

      setQueryResult(resultData);

      if (fields.length > 0) {
        const columns = fields.map(key => ({
          title: key,
          dataIndex: key,
          key: key,
          ellipsis: true,
          render: (text) => {
            if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
              try {
                return new Date(text).toLocaleString();
              } catch (e) {
                return text;
              }
            }
            if (typeof text === 'number') {
              return text.toFixed(2);
            }
            return text;
          }
        }));
        setTableColumns(columns);
      } else if (resultData.length > 0 && Array.isArray(resultData[0])) {
        const columns = resultData[0].map((_, index) => ({
          title: index + 1,
          dataIndex: index,
          key: index,
          ellipsis: true
        }));
        setTableColumns(columns);
      } else {
        setTableColumns([]);
        message.info('查询成功，没有数据返回');
      }

      if (resultData.length > 0) {
        message.success('查询成功');
      }
    } catch (error) {
      console.error('查询失败:', error);
      message.error('查询失败，请检查SQL语句或网络连接');
    } finally {
      setLoading(false);
    }
  }, []); // ✅ 这里依赖项为空没问题了，因为取值来自入参values，无闭包问题

  // 处理重置
  const handleReset = useCallback(() => {
    form.resetFields();
    setQueryResult([]);
    setTableColumns([]);
  }, [form]);

  // 格式化日期为字符串
  const formatDateToStr = (date) => {
    if (!(date instanceof Date)) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 处理快速时间选择
  const handleQuickTimeSelect = useCallback((rangeType) => {
    const now = new Date();
    let startTime, endTime;

    endTime = now;

    switch (rangeType) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '1d':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '3d':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 0, 0, 0);
        break;
      case '7d':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
        break;
      case '1m':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case 'lastm':
        startTime = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endTime = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case '1y':
        startTime = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'lasty':
        startTime = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
        endTime = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        return;
    }
    console.log('快速选择时间范围:', startTime, endTime);
    const formattedStartTime = formatDateToStr(startTime);
    const formattedEndTime = formatDateToStr(endTime);
    console.log('格式化后时间范围:', formattedStartTime, formattedEndTime);

    // 使用Date对象直接设置时间范围，兼容RangePicker的valueFormat
    form.setFieldsValue({
      timeRange: [formattedStartTime, formattedEndTime]
    });

  }, [form]);

  // 处理插入例子
  const handleInsertExample = useCallback(() => {
    const exampleSql = "select t_1002.* from t_1002 where time between ${startTime} and ${endTime}";
    form.setFieldsValue({ sql: exampleSql });
  }, [form]);

  const handleInsertExample2 = useCallback(() => {
    const exampleSql = "SELECT   date_bin_gapfill(INTERVAL '30 minutes', time) AS time, COALESCE(interpolate(avg(temperature)), 0) AS avg_temperature FROM t_1007 WHERE time >= now() - INTERVAL '7 days' AND time <= now() GROUP BY date_bin_gapfill(INTERVAL '30 minutes', time) ORDER BY time";
    form.setFieldsValue({ sql: exampleSql });
  }, [form]);

  const handleInsertExample3 = useCallback(() => {
    const exampleSql = "SELECT   date_bin_gapfill(INTERVAL '30 minutes', time) AS time, interpolate(avg(temperature)) AS avg_temperature FROM t_1007 WHERE time >= now() - INTERVAL '7 days' AND time <= now() GROUP BY date_bin_gapfill(INTERVAL '30 minutes', time) ORDER BY time";
    form.setFieldsValue({ sql: exampleSql });
  }, [form]);

  // 渲染ECharts图表
  const renderChart = () => {
    if (queryResult.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#999',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e8e8e8'
        }}>
          暂无数据可展示
        </div>
      );
    }

    const timeField = Object.keys(queryResult[0]).find(key =>
      key.toLowerCase().includes('time') || key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp')
    );

    const valueFields = Object.keys(queryResult[0]).filter(key => {
      if (key === 'id' || key === timeField) return false;

      // 检查字段是否至少在一行中是数值类型或可以转换为数值
      for (let i = 0; i < queryResult.length; i++) {
        const value = queryResult[i][key];
        if (typeof value === 'number') return true;
        if (typeof value === 'string' && !isNaN(Number(value))) return true;
      }

      // 如果所有行都是null/undefined，也将其视为数值字段（兼容空值情况）
      for (let i = 0; i < queryResult.length; i++) {
        const value = queryResult[i][key];
        if (value !== null && value !== undefined) return false;
      }

      return true;
    });

    if (!timeField) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#f5222d',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e8e8e8'
        }}>
          未找到时间字段，请确保查询结果包含时间信息
        </div>
      );
    }

    if (valueFields.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#f5222d',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e8e8e8'
        }}>
          未找到数值字段，请确保查询结果包含数值信息
        </div>
      );
    }

    const option = {
      title: {
        text: '时序数据曲线',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function (params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            // 处理空值和非数字情况，避免toFixed错误
            let value;
            // 因为data是[time, value]格式的数组，所以param.value也是数组
            const actualValue = Array.isArray(param.value) ? param.value[1] : param.value;
            
            if (actualValue === null || actualValue === undefined) {
              value = '-';
            } else if (typeof actualValue === 'number') {
              value = actualValue.toFixed(2);
            } else {
              // 尝试将非数字转换为数字
              const numValue = Number(actualValue);
              value = isNaN(numValue) ? actualValue : numValue.toFixed(2);
            }
            result += `${param.marker}${param.seriesName}: ${value}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: valueFields,
        bottom: 0,
        left: 'center',
        type: 'scroll',
        pageButtonItemGap: 5,
        pageTextStyle: {
          color: '#999'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: '{HH}:{mm}:{ss}',
          fontSize: 12
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}',
          fontSize: 12
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: valueFields.map(field => ({
        name: field,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        sampling: 'lttb',
        itemStyle: {
          opacity: 1
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.1
        },
        data: queryResult.map(item => {
          const time = new Date(item[timeField]).getTime();
          let value = item[field];

          // 处理数值，将非数值类型转换为null
          if (value === null || value === undefined) {
            value = null;
          } else if (typeof value !== 'number') {
            value = Number(value);
            if (isNaN(value)) {
              value = null;
            }
          }

          return [time, value];
        })
      }))
    };

    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e8e8e8',
        padding: '20px'
      }}>
        <ReactECharts
          option={option}
          style={{ height: 500 }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* <h1 className="page-title" style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>时序数据查询</h1> */}

      <div style={{
        marginBottom: '5px',
        padding: '5px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e8e8e8'
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleQuery}
        // initialValues={{
        //   timeRange: [
        //     '2026-01-15 00:00:00',
        //     '2026-01-15 00:00:50'
        //   ]
        // }}
        >
          <Form.Item
            name="sql"
            label={<span style={{ fontWeight: '500', fontSize: '14px' }}>SQL查询语句</span>}
            rules={[{ required: true, message: '请输入SQL查询语句' }]}
            extra="支持标准SQL语法，可使用${startTime}和${endTime}作为时间参数占位符"
          >
            <TextArea
              rows={3}
              placeholder="例如: SELECT time, value FROM sensor_data WHERE device_id = 'dev_001' AND time BETWEEN ${startTime} AND ${endTime} ORDER BY time"
              style={{
                fontFamily: 'monospace, Consolas, "Courier New", monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                backgroundColor: '#fafafa',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="timeRange"
            // label={<span style={{ fontWeight: '500', fontSize: '14px' }}>时间范围</span>}
            rules={[{ required: false, message: '请选择查询时间范围' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              valueFormat="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
          <Form.Item>
            <div style={{ marginTop: '1px' }}>
              <Row gutter={[8, 8]}>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('1h')}>前1小时</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('6h')}>前6小时</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('12h')}>前12小时</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('1d')}>当天</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('2d')}>昨天</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('3d')}>前三天</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('7d')}>前七天</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('1m')}>当月</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('lastm')}>上月</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('1y')}>今年</Button></Col>
                <Col><Button size="small" onClick={() => handleQuickTimeSelect('lasty')}>去年</Button></Col>
              </Row>
            </div>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button onClick={() => {
              window.open('https://docs.influxdata.com/influxdb3/core/query-data/sql/fill-gaps/', '_blank');
            }} style={{ marginRight: '10px' }}>
              官方文档
            </Button>
            <Button onClick={handleInsertExample} style={{ marginRight: '10px' }}>
              例子1
            </Button>
            <Button onClick={handleInsertExample2} style={{ marginRight: '10px' }}>
              例子2
            </Button>
            <Button onClick={handleInsertExample3} style={{ marginRight: '10px' }}>
              例子3
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: '10px' }}>
              查询
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={[
          {
            key: 'table',
            label: '表格视图',
            children: tableColumns.length > 0 ? (
              <Table
                columns={tableColumns}
                dataSource={queryResult}
                // 使用time字段作为rowKey，如果没有则使用deviceCode和时间的组合作为唯一标识
                rowKey={(record) => {
                  // 查找时间相关字段
                  const timeField = Object.keys(record).find(key =>
                    key.toLowerCase().includes('time') || key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp')
                  );
                  
                  // 如果有时间字段，使用时间字段作为rowKey
                  if (timeField) {
                    return record[timeField];
                  }
                  
                  // 如果没有时间字段，尝试使用deviceCode字段
                  if (record.deviceCode) {
                    return record.deviceCode;
                  }
                  
                  // 如果都没有，使用一个默认值
                  return Math.random().toString(36).substr(2, 9);
                }}
                bordered
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '15', '20', '50'],
                  showTotal: (total) => `共 ${total} 条记录`,
                  showQuickJumper: true
                }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e8e8e8'
                }}
                scroll={{ x: 'max-content' }}
                rowClassName={(record, index) => index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                size="middle"
              />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#999',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e8e8e8'
              }}>
                {loading ? (
                  <div>
                    <div style={{ marginBottom: '16px' }}>查询中...</div>
                    <div style={{ width: '100px', height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', margin: '0 auto' }}>
                      <div style={{ width: '30%', height: '100%', backgroundColor: '#1890ff', borderRadius: '2px', animation: 'loading 1.5s ease-in-out infinite' }}></div>
                    </div>
                  </div>
                ) : (
                  '请输入SQL查询语句并点击查询按钮'
                )}
              </div>
            )
          },
          {
            key: 'chart',
            label: '曲线视图',
            children: loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>查询中...</div>
            ) : (
              renderChart()
            )
          }
        ]}
      />
    </div>
  );
}

export default TimeSeriesDataQuery;