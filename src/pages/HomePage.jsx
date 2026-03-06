import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, List, Badge, Typography, Space, Button, Avatar } from 'antd';
import {
    LineChartOutlined,
    BarChartOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    DatabaseOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { wsBaseURL, alarmRecordApi, deviceApi } from '../utils/api.js';

const { Title, Text } = Typography;

// 设备统计数据
const deviceStatsData = [
    { title: '设备总数', value: 1256, icon: <EnvironmentOutlined />, color: '#108ee9' },
    { title: '在线设备', value: 1023, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '离线设备', value: 233, icon: <CloseCircleOutlined />, color: '#faad14' },
    { title: '故障设备', value: 45, icon: <ExclamationCircleOutlined />, color: '#f5222d' },
];



// 告警类型分布数据
// const alarmTypeDistributionData = [
//     { type: '温度异常', value: 35, color: '#ff4d4f' },
//     { type: '压力异常', value: 28, color: '#ffa940' },
//     { type: '湿度异常', value: 18, color: '#1890ff' },
//     { type: '电流异常', value: 12, color: '#52c41a' },
//     { type: '其他', value: 7, color: '#722ed1' },
// ];


const HomePage = () => {
    const [alarms, setAlarms] = useState([]);
    const ws = useRef(null);
    const [connected, setConnected] = useState(false);
    // 今日告警趋势数据
    const [todayAlarmTrendData, setTodayAlarmTrendData] = useState([]);

    const [alarmTypeDistributionData, setAlarmTypeDistributionData] = useState([]);

    // WebSocket连接
    useEffect(() => {
        // 获取告警记录
        const getAlarmRecords = async () => {
            try {
                const params = {
                    "deviceCode": "",
                    "modelId": "",
                    "alarmLevel": "",
                    "status": "active",
                    "startTime": null,
                    "endTime": null,
                };
                const res = await alarmRecordApi.getByConditions(params);
                setAlarms(res);
            } catch (error) {
                message.error('获取告警记录失败');
            }
        };
        getAlarmRecords();
        // 获取设备统计数据
        const getDeviceStats = async () => {
            try {
                const res = await deviceApi.static();
                console.log('设备统计数据:', res);
                deviceStatsData[0].value = res.totalCount;
                deviceStatsData[1].value = res.onlineCount;
                deviceStatsData[2].value = res.offlineCount;
                deviceStatsData[3].value = res.repairingCount;
            } catch (error) {
                message.error('获取设备统计数据失败');
            }
        };
        getDeviceStats();
        // 获取今日告警趋势数据
        const getTodayAlarmTrend = async () => {
            try {
                const res = await alarmRecordApi.staticByHour();
                console.log('今日告警趋势数据:', res);
                setTodayAlarmTrendData(res);
            } catch (error) {
                message.error('获取今日告警趋势数据失败');
            }
        };
        getTodayAlarmTrend();

        // 获取告警类型分布数据
        const getAlarmTypeDistribution = async () => {
            try {
                const res = await alarmRecordApi.staticByDescription();
                console.log('告警类型分布数据:', res);
                setAlarmTypeDistributionData(res);
            } catch (error) {
                message.error('获取告警类型分布数据失败');
            }
        };
        getAlarmTypeDistribution();

        // 创建WebSocket连接
        const webSocket = new WebSocket(wsBaseURL);
        console.log('尝试连接WebSocket:', wsBaseURL);

        webSocket.onopen = () => {
            console.log('WebSocket连接已建立');
            setConnected(true);
        };

        webSocket.onmessage = (event) => {
            try {
                const newAlarm = JSON.parse(event.data);
                setAlarms(prevAlarms => [newAlarm, ...prevAlarms]);
                console.log('接收到WebSocket消息:', newAlarm);
            } catch (error) {
                console.error('解析WebSocket消息失败:', error);
            }
        };

        webSocket.onerror = (error) => {
            console.error('WebSocket错误:', error);
        };

        webSocket.onclose = () => {
            console.log('WebSocket连接已关闭');
            setConnected(false);
        };

        ws.current = webSocket;

        // 清理函数
        return () => {
            webSocket.close();
        };
    }, []);

    // 获取告警级别对应的颜色和图标
    const getAlarmLevelConfig = (level) => {
        switch (level) {
            case 'high':
                return { color: '#ff4d4f', icon: <ExclamationCircleOutlined /> };
            case 'medium':
                return { color: '#ffa940', icon: <WarningOutlined /> };
            case 'low':
                return { color: '#1890ff', icon: <InfoCircleOutlined /> };
            default:
                return { color: '#1890ff', icon: <InfoCircleOutlined /> };
        }
    };

    // 今日告警趋势图表配置（ECharts）
    const lineConfig = {
        xAxis: {
            type: 'category',
            data: todayAlarmTrendData.map(item => item.hour),
            axisLabel: {
                rotate: 45,
            },
        },
        yAxis: {
            type: 'value',
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const data = params[0];
                return `${data.name}: ${data.value}次`;
            },
        },
        series: [
            {
                data: todayAlarmTrendData.map(item => item.count),
                type: 'line',
                smooth: true,
                symbol: 'diamond',
                symbolSize: 8,
                lineStyle: {
                    color: '#ff4d4f',
                },
                itemStyle: {
                    color: '#ff4d4f',
                },
            },
        ],
    };

    // 告警类型分布图表配置（ECharts）
    const pieConfig = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            left: 10,
            data: alarmTypeDistributionData.map(item => item.description),
        },
        series: [
            {
                name: '告警类型',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2,
                },
                label: {
                    show: false,
                    position: 'center',
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 30,
                        fontWeight: 'bold',
                    },
                },
                labelLine: {
                    show: false,
                },
                data: alarmTypeDistributionData.map(item => ({
                    name: item.description,
                    value: item.count,
                    itemStyle: {
                        color: item.color,
                    },
                })),
            },
        ],
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            {/* <Title level={2}>平台首页</Title> */}

            {/* 设备统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {deviceStatsData.map((stat, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.icon}
                                styles={{ content: { color: stat.color } }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* 告警数据图表 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                    <Card title={<><LineChartOutlined />今日告警趋势</>}>
                        <ReactECharts option={lineConfig} style={{ height: 300 }} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title={<><BarChartOutlined />告警类型分布</>}>
                        <ReactECharts option={pieConfig} style={{ height: 300 }} />
                    </Card>
                </Col>
            </Row>

            {/* 实时告警列表 */}
            <Card
                title={<><WarningOutlined />实时告警列表</>}
                extra={
                    <Badge status={connected ? 'success' : 'error'} text={connected ? '已连接' : '未连接'} />
                }
            >
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {alarms.map((alarm, index) => {
                            const alarmConfig = getAlarmLevelConfig(alarm.alarmLevel);
                            // 使用alarm.id或uuid或索引作为唯一键
                            const uniqueKey = alarm.id || `alarm-${index}-${Date.now()}`;
                            return (
                                <li key={uniqueKey} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Avatar icon={alarmConfig.icon} style={{ backgroundColor: alarmConfig.color, marginRight: '12px', marginTop: '4px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                                <Text strong>{alarm.deviceName}</Text>
                                                <Badge color={alarmConfig.color} text={alarm.alarmType} style={{ marginLeft: '8px' }} />
                                            </div>
                                            <div style={{ marginBottom: '4px' }}>
                                                <Text>{alarm.alarmMessage}</Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(0, 0, 0, 0.65)' }}>
                                                <ClockCircleOutlined style={{ fontSize: '14px', marginRight: '4px' }} />{alarm.createTime}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            {/* <Button type="link" size="small">查看详情</Button> */}
                                            <Button type="link" size="small">处理</Button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default HomePage;