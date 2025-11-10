import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './MembershipRequest.css';
import goldImg from '../assets/gold.webp';
import platinumImg from '../assets/platinum.webp';
import amethystImg from '../assets/ame.webp';
import solitaireImg from '../assets/Solitaire.webp';
import silverImg from '../assets/silver.webp';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://party-one-developer.uc.r.appspot.com';
const UPLOAD_URL = import.meta.env.VITE_MULTIPLEIMAGES_POSTING_URL || API_BASE_URL;

const MembershipRequest = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const optionsRef = useRef([]);

    const [memberships, setMemberships] = useState([]);
    const [selectedMembership, setSelectedMembership] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [kycDetails, setKycDetails] = useState(null);
    const [cabinCrewImages, setCabinCrewImages] = useState({
        frontId: null,
        backId: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [kycLocations, setKycLocations] = useState({
        countries: [],
        states: [],
        cities: []
    });
    const [kycForm, setKycForm] = useState({
        frontId: null,
        backId: null,
        userPhoto: null,
        name: '',
        nationality: '',
        mailingAddress: '',
        pincode: '',
        governmentNumber: '',
        frequencyOfClubbing: 'Occasionally',
        country: '',
        countryName: '',
        state: '',
        stateName: '',
        city: '',
        cityName: ''
    });
    const [showKycModal, setShowKycModal] = useState(false);
    const [previewImages, setPreviewImages] = useState({
        frontId: '',
        backId: '',
        userPhoto: ''
    });

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        fetchMemberships();
        fetchCountries();
        checkKycStatus();
    }, [currentUser]);

    const fetchMemberships = async () => {
        try {
            console.log('Fetching memberships from Firestore...');
            const response = await getDocs(collection(db, 'memberships'));
            const options = response.docs.map((doc) => doc.data());
            console.log('Memberships from Firestore:', options);
            
            optionsRef.current = options;
            filterAvailableMemberships(userData?.active_membership_name);
        } catch (err) {
            console.error('Error fetching memberships:', err);
            setError('Failed to load memberships');
        }
    };

    const filterAvailableMemberships = (activeMembership) => {
        let availableMemberships = [];

        switch (activeMembership) {
            case 'Silver':
                availableMemberships = optionsRef.current.filter(m =>
                    ['Gold', 'Platinum', 'Amethyst', 'Solitaire'].includes(m.name)
                );
                break;
            case 'Gold':
                availableMemberships = optionsRef.current.filter(m =>
                    ['Platinum', 'Amethyst', 'Solitaire'].includes(m.name)
                );
                break;
            case 'Platinum':
                availableMemberships = optionsRef.current.filter(m =>
                    ['Amethyst', 'Solitaire'].includes(m.name)
                );
                break;
            case 'Solitaire':
                availableMemberships = optionsRef.current.filter(m =>
                    ['Amethyst'].includes(m.name)
                );
                break;
            case 'Amethyst':
                availableMemberships = optionsRef.current.filter(m =>
                    ['Gold', 'Platinum', 'Solitaire'].includes(m.name)
                );
                break;
            default:
                availableMemberships = optionsRef.current;
        }

        setMemberships(availableMemberships);
    };

    const checkKycStatus = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/kyc/v1/getKyc?user_id=${currentUser.uid}`
            );
            
            // Check if response is OK before parsing JSON
            if (!response.ok) {
                // 404 is expected for users who haven't submitted KYC yet
                if (response.status === 404) {
                    console.log('No KYC found for user (expected for new users)');
                    return;
                }
                console.warn(`KYC check failed with status ${response.status}`);
                return;
            }

            const data = await response.json();

            if (data.success && data.data) {
                setKycDetails(data.data);
            }
        } catch (err) {
            console.error('Error checking KYC:', err);
        }
    };

    const fetchCountries = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/location/v2/countries`);
            const result = await response.json();
            if (result.success && result.data) {
                setKycLocations(prev => ({ ...prev, countries: result.data }));
            }
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    };

    const fetchStates = async (countryId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/location/v1/userState?country=${countryId}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setKycLocations(prev => ({ ...prev, states: result.data }));
            }
        } catch (err) {
            console.error('Error fetching states:', err);
        }
    };

    const fetchCities = async (countryId, stateId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/location/v3/userCities?country=${countryId}&state=${stateId}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setKycLocations(prev => ({ ...prev, cities: result.data }));
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
        }
    };

    const uploadImage = async (imageFile) => {
        const formData = new FormData();
        formData.append('images', imageFile);

        try {
            const response = await fetch(`${UPLOAD_URL}/uploads/uploadImages`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data.url && data.url[0];
        } catch (err) {
            console.error('Error uploading image:', err);
            throw err;
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedFormats.includes(file.type)) {
            setError('Invalid file format. Please use JPEG, PNG, or GIF');
            return;
        }

        if (field === 'cabinCrewFront' || field === 'cabinCrewBack') {
            setCabinCrewImages(prev => ({
                ...prev,
                [field === 'cabinCrewFront' ? 'frontId' : 'backId']: file
            }));
        } else {
            setKycForm(prev => ({ ...prev, [field]: file }));

            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImages(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const submitKyc = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get Firebase ID token for authentication
            const token = await currentUser.getIdToken();
            console.log('Got Firebase token for KYC submission');

            // Upload images first (3 separate calls like admin panel)
            const frontIdUrl = await uploadImage(kycForm.frontId);
            const backIdUrl = await uploadImage(kycForm.backId);
            const userPhotoUrl = await uploadImage(kycForm.userPhoto);

            // Build payload exactly like admin panel
            const kycPayload = {
                user_id: currentUser.uid,
                name: kycForm.name,
                nationalty: kycForm.nationality,
                residency: "residency",
                home_country_id: kycForm.country,
                home_country_name: kycForm.countryName,
                permanent_address: `${kycForm.mailingAddress},${kycForm.pincode}`,
                home_state_id: kycForm.state,
                home_state_name: kycForm.stateName,
                home_city_id: kycForm.city,
                home_city_name: kycForm.cityName,
                government_id_number: kycForm.governmentNumber,
                frequency_of_clubbing: kycForm.frequencyOfClubbing,
                govt_id_front: frontIdUrl || null,
                govt_id_back: backIdUrl || null,
                user_image: userPhotoUrl || null,
                zipcode: kycForm.pincode
            };

            console.log('KYC Payload:', kycPayload);

            // Use /kyc/v2/kyc endpoint like admin panel with token
            const response = await fetch(`${API_BASE_URL}/kyc/v2/kyc`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'developement': 'true',
                    'token': token
                },
                body: JSON.stringify(kycPayload)
            });

            const data = await response.json();
            console.log('KYC Response:', data);

            if (data.success || response.ok) {
                setShowKycModal(false);
                setSuccess('KYC submitted successfully!');
                // Auto-proceed to membership request
                setTimeout(() => {
                    submitMembershipRequest();
                }, 500);
            } else {
                throw new Error(data.message || 'KYC submission failed');
            }
        } catch (err) {
            console.error('KYC Error:', err);
            setError(err.message || 'Failed to submit KYC');
        } finally {
            setLoading(false);
        }
    };

    const submitMembershipRequest = async () => {
        if (!selectedMembership || !currentUser) {
            setError('Please select a membership');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get Firebase ID token for authentication
            const token = await currentUser.getIdToken();
            console.log('Got Firebase token for membership request');

            const membership = memberships.find(m => m.id === selectedMembership);
            const isAmethyst = membership.name === 'Amethyst';

            let cabinCrewFrontUrl = null;
            let cabinCrewBackUrl = null;

            if (isAmethyst && cabinCrewImages.frontId && cabinCrewImages.backId) {
                cabinCrewFrontUrl = await uploadImage(cabinCrewImages.frontId);
                cabinCrewBackUrl = await uploadImage(cabinCrewImages.backId);
            }

            const plan = isAmethyst
                ? membership.plans.find(p => p.plan_unique_id === selectedPlan)
                : membership.plans[0];

            const payload = {
                membership_id: membership.id,
                membership_name: membership.name,
                membership_plan_id: isAmethyst ? selectedPlan : plan.plan_unique_id,
                referral_code: null,
                amount: plan.price,
                old_membership_id: userData?.active_membership_id || null,
                old_membership_name: userData?.active_membership_name || null,
                user_id: currentUser.uid,
                cabin_crew: isAmethyst,
                govt_front_image_id: kycDetails?.govt_id_front,
                govt_back_image_id: kycDetails?.govt_id_back,
                cabin_crew_front_image_id: cabinCrewFrontUrl,
                cabin_crew_back_image_id: cabinCrewBackUrl
            };

            console.log('Membership Request Payload:', payload);
            console.log('🎯 Using v4/membershipRequestWithPayment endpoint - payment link will be generated automatically');

            // Use V4 endpoint that generates payment link immediately
            const response = await fetch(
                `${API_BASE_URL}/membership/v4/membershipRequestWithPayment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'developement': 'true',
                        'token': token
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();
            console.log('Membership Request Response:', data);

            if (data.success && data.payment_link) {
                console.log('✅ Membership request created and payment link generated');
                console.log('💳 Payment link:', data.payment_link);
                console.log('📋 Subscription type:', data.subscription_type);
                console.log('📅 Duration:', data.duration_months, 'months');
                
                setSuccess('Redirecting to payment...');
                
                // Redirect to Stripe payment link
                setTimeout(() => {
                    window.location.href = data.payment_link;
                }, 1500);
            } else {
                throw new Error(data.message || 'Request failed');
            }
        } catch (err) {
            console.error('Membership Request Error:', err);
            setError(err.message || 'Failed to submit membership request');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!kycDetails) {
            setShowKycModal(true);
            return;
        }

        await submitMembershipRequest();
    };

    const selectedMembershipData = memberships.find(m => m.id === selectedMembership);
    const isAmethyst = selectedMembershipData?.name === 'Amethyst';

    // Local image map for memberships (fallback to display_image if not found)
    const imageMap = {
        Gold: goldImg,
        Platinum: platinumImg,
        Amethyst: amethystImg,
        Solitaire: solitaireImg,
        Silver: silverImg
    };

    return (
        <div className="mem-page">
            <div className="mem-container">
                <header className="mem-header">
                    <p className="mem-subtitle">Welcome, {userData?.name || currentUser?.email}</p>
                </header>

                {error && (
                    <div className="mem-alert mem-alert-danger" role="alert">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {success && (
                    <div className="mem-alert mem-alert-success" role="status">{success}</div>
                )}

                {userData?.active_membership_name && (
                    <div className="mem-info">
                        <strong>Current Membership:</strong> {userData.active_membership_name}
                    </div>
                )}

                <section className="mem-grid" aria-label="Membership options">
                    {memberships.map((m) => {
                        const selected = selectedMembership === m.id;
                        const price = m.plans?.[0]?.price ?? 0;
                        return (
                            <article
                                key={m.id}
                                className={`mem-card ${selected ? 'selected' : ''}`}
                                onClick={() => { setSelectedMembership(m.id); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMembership(m.id); }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selected}
                                aria-label={`${m.name} membership card${selected ? ' (selected)' : ''}`}
                            >
                                <div className="mem-card-media">
                                                                        <img
                                                                            src={imageMap[m.name] || m.display_image}
                                                                            alt={`${m.name} membership visual`}
                                                                            loading="lazy"
                                                                        />
                                </div>
                                <div className="mem-card-body">
                                    <div className="mem-card-header">
                                        <h3 className="mem-name">{m.name}</h3>
                                        <div className="mem-price">${price}</div>
                                    </div>
                                    {m.tagline?.taglines?.[0] && (
                                        <p className="mem-tagline">{m.tagline.taglines[0]}</p>
                                    )}
                                    <ul className="mem-benefits">
                                        {(m.benifits || m.benefits || []).slice(0,3).map((b, idx) => (
                                            <li key={idx}>{b.title || b.description}</li>
                                        ))}
                                    </ul>

                                    {/* Inline plan chooser for Amethyst when selected */}
                                    {selected && m.name === 'Amethyst' && (
                                        <div className="mem-plans">
                                            {m.plans.map((plan) => (
                                                <label
                                                    key={plan.plan_unique_id}
                                                    className={`plan-chip ${selectedPlan === plan.plan_unique_id ? 'active' : ''}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="amethyst-plan"
                                                        value={plan.plan_unique_id}
                                                        checked={selectedPlan === plan.plan_unique_id}
                                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                                    />
                                                    <span>{plan.duration} mo</span>
                                                    <strong>${plan.price}</strong>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mem-actions">
                                        <button
                                            type="button"
                                            className="primary-btn"
                                            onClick={(e) => { e.stopPropagation(); setSelectedMembership(m.id); setSelectedPlan(''); }}
                                            aria-pressed={selected}
                                        >
                                            {selected ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>

                {/* Extra requirements for Amethyst */}
                {isAmethyst && (
                    <section className="mem-extra">
                        <h2 className="section-title">Cabin Crew Verification</h2>
                        <div className="dual-row">
                            <div className="form-field">
                                <label className="field-label">Cabin Crew Front ID *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'cabinCrewFront')}
                                    className="file-input"
                                    required
                                />
                                <p className="field-hint">Allowed formats: JPEG, PNG, GIF</p>
                            </div>
                            <div className="form-field">
                                <label className="field-label">Cabin Crew Back ID *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'cabinCrewBack')}
                                    className="file-input"
                                    required
                                />
                                <p className="field-hint">Allowed formats: JPEG, PNG, GIF</p>
                            </div>
                        </div>
                    </section>
                )}

                <form onSubmit={handleSubmit} className="mem-submit">
                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={loading || !selectedMembership || (isAmethyst && !selectedPlan)}
                    >
                        {loading ? 'Processing…' : 'Submit Request'}
                    </button>
                    <button type="button" className="outline-btn back-btn" onClick={() => navigate('/form')}>
                        ← Back to Dashboard
                    </button>
                </form>
            </div>

            {/* KYC Modal */}
            {showKycModal && (
                <div className="mem-modal-overlay">
                    <div className="mem-modal">
                        <h2 className="mem-modal-title">Complete KYC Verification</h2>
                        <p className="mem-modal-subtitle">KYC verification is required before applying for membership</p>

                        <form onSubmit={submitKyc} className="kyc-form">
                            <div className="form-field">
                                <label className="field-label">Government ID (Front) *</label>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'frontId')} className="file-input" required />
                                {previewImages.frontId && (<img src={previewImages.frontId} alt="Front ID" className="preview" />)}
                            </div>

                            <div className="form-field">
                                <label className="field-label">Government ID (Back) *</label>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'backId')} className="file-input" required />
                                {previewImages.backId && (<img src={previewImages.backId} alt="Back ID" className="preview" />)}
                            </div>

                            <div className="form-field">
                                <label className="field-label">Your Photo *</label>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'userPhoto')} className="file-input" required />
                                {previewImages.userPhoto && (<img src={previewImages.userPhoto} alt="User Photo" className="preview" />)}
                            </div>

                            <div className="form-field">
                                <label className="field-label">Full Name *</label>
                                <input type="text" value={kycForm.name} onChange={(e) => setKycForm({ ...kycForm, name: e.target.value })} className="text-input" placeholder="Enter your full name" required />
                            </div>

                            <div className="form-field">
                                <label className="field-label">Government ID Number *</label>
                                <input type="text" value={kycForm.governmentNumber} onChange={(e) => setKycForm({ ...kycForm, governmentNumber: e.target.value })} className="text-input" placeholder="Enter government ID number" required />
                            </div>

                            <div className="form-field">
                                <label className="field-label">Nationality *</label>
                                <input type="text" value={kycForm.nationality} onChange={(e) => setKycForm({ ...kycForm, nationality: e.target.value })} className="text-input" placeholder="Enter nationality" required />
                            </div>

                            <div className="form-field">
                                <label className="field-label">Country *</label>
                                <select
                                    value={kycForm.country}
                                    onChange={(e) => {
                                        const selectedCountry = kycLocations.countries.find(c => c.id === parseInt(e.target.value));
                                        setKycForm({
                                            ...kycForm,
                                            country: e.target.value,
                                            countryName: selectedCountry?.name || '',
                                            state: '',
                                            stateName: '',
                                            city: '',
                                            cityName: ''
                                        });
                                        fetchStates(e.target.value);
                                    }}
                                    className="select-input"
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {kycLocations.countries.map((country) => (
                                        <option key={country.id} value={country.id}>{country.name}</option>
                                    ))}
                                </select>
                            </div>

                            {kycForm.country && (
                                <div className="form-field">
                                    <label className="field-label">State *</label>
                                    <select
                                        value={kycForm.state}
                                        onChange={(e) => {
                                            const selectedState = kycLocations.states.find(s => s.id === parseInt(e.target.value));
                                            setKycForm({
                                                ...kycForm,
                                                state: e.target.value,
                                                stateName: selectedState?.name || '',
                                                city: '',
                                                cityName: ''
                                            });
                                            fetchCities(kycForm.country, e.target.value);
                                        }}
                                        className="select-input"
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {kycLocations.states.map((state) => (
                                            <option key={state.id} value={state.id}>{state.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {kycForm.state && (
                                <div className="form-field">
                                    <label className="field-label">City *</label>
                                    <select
                                        value={kycForm.city}
                                        onChange={(e) => {
                                            const selectedCity = kycLocations.cities.find(c => c.id === parseInt(e.target.value));
                                            setKycForm({
                                                ...kycForm,
                                                city: e.target.value,
                                                cityName: selectedCity?.name || ''
                                            });
                                        }}
                                        className="select-input"
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {kycLocations.cities.map((city) => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-field">
                                <label className="field-label">Mailing Address *</label>
                                <input type="text" value={kycForm.mailingAddress} onChange={(e) => setKycForm({ ...kycForm, mailingAddress: e.target.value })} className="text-input" placeholder="Enter mailing address" required />
                            </div>

                            <div className="form-field">
                                <label className="field-label">Pincode *</label>
                                <input type="text" value={kycForm.pincode} onChange={(e) => setKycForm({ ...kycForm, pincode: e.target.value })} className="text-input" placeholder="Enter pincode" required />
                            </div>

                            <div className="form-field">
                                <label className="field-label">How often do you visit clubs? *</label>
                                <select value={kycForm.frequencyOfClubbing} onChange={(e) => setKycForm({ ...kycForm, frequencyOfClubbing: e.target.value })} className="select-input" required>
                                    <option value="Mostly daily">Regularly</option>
                                    <option value="Weekly">Weekends Only</option>
                                    <option value="Occasionally">Occasionally</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="outline-btn" onClick={() => setShowKycModal(false)} disabled={loading}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Submitting…' : 'Submit KYC & Continue'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px'
    },
    card: {
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '40px'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '10px'
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px'
    },
    infoBox: {
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        color: '#1565c0'
    },
    errorBox: {
        backgroundColor: '#ffebee',
        border: '1px solid #ef5350',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#c62828'
    },
    successBox: {
        backgroundColor: '#e8f5e9',
        border: '1px solid #81c784',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#2e7d32'
    },
    formGroup: {
        marginBottom: '24px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333'
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        boxSizing: 'border-box'
    },
    fileInput: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        boxSizing: 'border-box'
    },
    radioGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s'
    },
    radio: {
        marginRight: '12px',
        width: '20px',
        height: '20px',
        cursor: 'pointer'
    },
    radioText: {
        fontSize: '16px',
        color: '#333',
        fontWeight: '500'
    },
    hint: {
        fontSize: '12px',
        color: '#f59e0b',
        marginTop: '4px'
    },
    submitButton: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    backButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'white',
        color: '#1976d2',
        border: '2px solid #1976d2',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        marginTop: '16px'
    },
    buttonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '20px'
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    modalTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '8px'
    },
    modalSubtitle: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '24px'
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px'
    },
    cancelButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: 'white',
        color: '#666',
        border: '2px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    preview: {
        width: '100%',
        maxWidth: '200px',
        marginTop: '8px',
        borderRadius: '8px',
        border: '1px solid #ddd'
    }
};

export default MembershipRequest;
