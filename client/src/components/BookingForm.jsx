import React, { useState } from 'react';
import axios from 'axios';

const SERVICES = [
    { id: 'srv_1', name: 'General Checkup', price: 500 },
    { id: 'srv_2', name: 'X-Ray', price: 1200 },
    { id: 'srv_3', name: 'Blood Test', price: 300 },
    { id: 'srv_999', name: 'Broken Service (Test Fail)', price: 0 },
];

export default function BookingForm() {
    const [formData, setFormData] = useState({
        name: '',
        gender: 'Female',
        dob: '',
        selectedServices: []
    });
    const [loading, setLoading] = useState(false);
    const [quota, setQuota] = useState({ used: 0, limit: 100 });
    const [isEligible, setIsEligible] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState(null);

    // Fetch quota on load and refresh periodically
    React.useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/quota');
                setQuota(res.data);
            } catch (err) {
                console.error("Failed to fetch quota", err);
            }
        };
        fetchQuota();
        const interval = setInterval(fetchQuota, 2000); // Polling for simplicity
        return () => clearInterval(interval);
    }, []);

    // Check eligibility when form changes
    React.useEffect(() => {
        if (!formData.dob) {
            setIsEligible(false);
            return;
        }
        const today = new Date();
        const dob = new Date(formData.dob);
        const isBirthday = today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth();
        const isFemale = formData.gender === 'Female';
        setIsEligible(isFemale && isBirthday);
    }, [formData.dob, formData.gender]);

    const toggleService = (id) => {
        setFormData(prev => {
            const exists = prev.selectedServices.includes(id);
            return {
                ...prev,
                selectedServices: exists
                    ? prev.selectedServices.filter(s => s !== id)
                    : [...prev.selectedServices, id]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/book', formData);
        } catch (err) {
            console.error(err);
            alert('Failed to submit booking');
        } finally {
            setLoading(false);
        }
    };

    const resetQuota = async () => {
        await axios.post('http://localhost:3000/api/reset-quota');
        alert('Quota reset!');
    };

    // const runScenario = async (type) => {
    //     const today = new Date().toISOString().split('T')[0];
    //     setFormData({
    //         name: 'Test User',
    //         gender: 'Female',
    //         dob: today,
    //         selectedServices: ['srv_1'] // 500
    //     });

    //     if (type === 'POSITIVE') {
    //         await axios.post('http://localhost:3000/api/reset-quota');
    //     } else if (type === 'QUOTA_FAIL') {
    //         await axios.post('http://localhost:3000/api/test/fill-quota');
    //     } else if (type === 'PAYMENT_FAIL') {
    //         await axios.post('http://localhost:3000/api/reset-quota');
    //         await axios.post('http://localhost:3000/api/test/fail-next-payment');
    //     }
    // };

    const runScenario = async (type) => {
        setSelectedScenario(type);

        const today = new Date().toISOString().split('T')[0];
        setFormData({
            name: 'Test User',
            gender: 'Female',
            dob: today,
            selectedServices: ['srv_1']
        });

        if (type === 'POSITIVE') {
            await axios.post('http://localhost:3000/api/reset-quota');
        } else if (type === 'QUOTA_FAIL') {
            await axios.post('http://localhost:3000/api/test/fill-quota');
        } else if (type === 'PAYMENT_FAIL') {
            await axios.post('http://localhost:3000/api/reset-quota');
            await axios.post('http://localhost:3000/api/test/fail-next-payment');
        }
    };

    const scenarioButtonStyle = (type, base, border, text) => ({
        background: selectedScenario === type ? base : `${base}AA`,
        border: `1px solid ${border}`,
        color: text,
        padding: '0.5rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        transition: 'all 0.2s ease',
        outline: selectedScenario === type ? `2px solid ${border}` : 'none'
    });

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="title-glow" style={{ marginTop: 0, marginBottom: '0.5rem' }}>New Booking</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Enter patient details to initiate SAGA transaction.</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ color: '#aaa' }}>R2 DAILY QUOTA</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: quota.used >= quota.limit ? 'var(--error)' : 'var(--success)' }}>
                        {quota.used} / {quota.limit}
                    </div>
                </div>
            </div>

            {isEligible && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', color: '#bbf7d0', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🎉</span>
                    <strong>Eligible for 12% Birthday Discount!</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Subject to Daily Quota)</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Patient Name</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Gender</label>
                        <select
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Date of Birth</label>
                        <input
                            required
                            type="date"
                            value={formData.dob}
                            onChange={e => setFormData({ ...formData, dob: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Select Services</label>
                    <div className="service-grid">
                        {SERVICES.map(srv => (
                            <div
                                key={srv.id}
                                className={`service-card ${formData.selectedServices.includes(srv.id) ? 'selected' : ''}`}
                                onClick={() => toggleService(srv.id)}
                            >
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{srv.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹{srv.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Request'}
                </button>
            </form>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <label style={{ marginBottom: '1rem', display: 'block' }}>Run Verification Scenario</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {/* <button
                        onClick={() => runScenario('POSITIVE')}
                        style={{ background: '#064e3b', border: '1px solid #059669', color: '#a7f3d0', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        1. Positive Case
                    </button>
                    <button
                        onClick={() => runScenario('QUOTA_FAIL')}
                        style={{ background: '#713f12', border: '1px solid #d97706', color: '#fde68a', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        2. Neg: Quota Full
                    </button>
                    <button
                        onClick={() => runScenario('PAYMENT_FAIL')}
                        style={{ background: '#7f1d1d', border: '1px solid #dc2626', color: '#fecaca', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        3. Neg: Payment Fail
                    </button> */}
                    <button
                        onClick={() => runScenario('POSITIVE')}
                        style={scenarioButtonStyle('POSITIVE', '#064e3b', '#059669', '#a7f3d0')}
                        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseOut={e => e.currentTarget.style.filter = 'none'}
                    >
                        1. Positive Case {selectedScenario === 'POSITIVE' && '✓'}
                    </button>

                    <button
                        onClick={() => runScenario('QUOTA_FAIL')}
                        style={scenarioButtonStyle('QUOTA_FAIL', '#713f12', '#d97706', '#fde68a')}
                        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseOut={e => e.currentTarget.style.filter = 'none'}
                    >
                        2. Neg: Quota Full {selectedScenario === 'QUOTA_FAIL' && '✓'}
                    </button>

                    <button
                        onClick={() => runScenario('PAYMENT_FAIL')}
                        style={scenarioButtonStyle('PAYMENT_FAIL', '#7f1d1d', '#dc2626', '#fecaca')}
                        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseOut={e => e.currentTarget.style.filter = 'none'}
                    >
                        3. Neg: Payment Fail {selectedScenario === 'PAYMENT_FAIL' && '✓'}
                    </button>

                </div>
            </div>
        </div>
    );
}
