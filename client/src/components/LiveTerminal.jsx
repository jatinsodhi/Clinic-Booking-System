import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000';
const socket = io(API_URL);

export default function LiveTerminal() {
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);
    const [hover, setHover] = useState(false);

    useEffect(() => {
        socket.on('system-event', (data) => {
            // Add to logs
            setLogs(prev => [...prev, data]);
        });
        return () => socket.off('system-event');
    }, []);

    // useEffect(() => {
    //     // Auto scroll
    //     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [logs]);

    const getLogType = (topic) => {
        if (topic.includes('FAILED') || topic.includes('REJECTED')) return 'error';
        if (topic.includes('CONFIRMED') || topic.includes('SUCCESS') || topic.includes('APPLIED') || topic.includes('RELEASED')) return 'success';
        if (topic.includes('WARN')) return 'warn';
        return 'info';
    };

    return (
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
                    Live System Terminal
                </h3>
                <button onClick={() => setLogs([])}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', color: hover ? '#fff' : '#666', }}>Clear</button>
            </div>

            <div className="terminal-window">
                {logs.length === 0 && (
                    <div style={{ color: '#444', textAlign: 'center', marginTop: '2rem' }}>
                        Waiting for system events...
                    </div>
                )}
                {logs.map((log, index) => {
                    const type = getLogType(log.topic);
                    return (
                        <div key={index} className={`log-entry ${type}`}>
                            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>[{log.topic}]</span>
                            <span>{JSON.stringify(log.payload)}</span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
