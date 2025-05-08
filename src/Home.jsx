import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Home.css';

const serverURL = 'http://localhost:8080';

const Home = () => {
    const [userId, setUserId] = useState('');
    const [showButton, setShowButton] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [ranking, setRanking] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const navigate = useNavigate()
    const location = useLocation();

    // 숫자만 입력하도록 ( 임시 )
    const handleChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setUserId(value);
            setShowButton(value.trim().length > 0);
        }
    };

    const registerUser = async () => {
        const confirm = window.confirm("대기열에서 참여하시겠습니까 ?");
        if (!confirm) return;

        try {
            const res = await fetch(`${serverURL}/user/enter?user_id=${userId}&queueType=reserve`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error("이미 등록된 사용자이거나 오류 발생");
            alert(`${userId}님, 대기열 등록 완료!`);
            setIsWaiting(true);
        } catch (err) {
            alert(err.message);
        }
    };

    const cancelUser = async () => {
        const confirm = window.confirm("대기열에서 취소하시겠습니까?");
        if (!confirm) return;

        try {
            const res = await fetch(`${serverURL}/user/cancel?user_id=${userId}&queueType=reserve`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert("대기열 취소 완료!");
                setIsWaiting(false);
                setUserId('');
                setRanking(null);
                setShowButton(false);
                setConfirmed(false);
            } else {
                throw new Error("취소 실패");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const validationTokenCheck = async () => {
        try {
            const res = await fetch(`${serverURL}/user/cancel?user_id=${userId}&queueType=reserve`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert("대기열 취소 완료!");
                setIsWaiting(false);
                setUserId('');
                setRanking(null);
                setShowButton(false);
                setConfirmed(false);
            } else {
                throw new Error("취소 실패");
            }
        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => {
        if (!isWaiting || !userId) return;

        const sse = new EventSource(`${serverURL}/queue/stream?userId=${userId}&queueType=reserve`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event === 'update') {
                    setRanking(data.rank);
                } else if (data.event === 'confirmed') {
                    localStorage.setItem("user_id", data.user_id);

                    fetch(`${serverURL}/user/createCookie?queueType=reserve&user_id=${data.user_id}`, {
                        method: 'GET',
                        credentials: 'include' // 쿠키를 받기 위해 필요
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("쿠키 발급 실패");
                        }
                
                        // 쿠키 발급 성공 후 이동
                        setConfirmed(true);
                        navigate('/target-page');
                        sse.close();
                    })
                    .catch(error => {
                        console.error("토큰 발급 중 오류 발생:", error);
                        alert("서버 오류로 이동할 수 없습니다.");
                    });
                }
            } catch (e) {
                console.warn('SSE 데이터 파싱 실패:', event.data);
            }
        };

        sse.onopen = () => {
            console.log("SSE 연결 성공!");
        };

        sse.onerror = (err) => {
            console.error('SSE 연결 오류:', err);
            sse.close();
        };

        return () => {
            sse.close();
        };
    }, [isWaiting, userId]);

    useEffect(() => {
        if (location.pathname === "/") {
          localStorage.clear();
        }
      }, [location]);

    if (isWaiting) {
        return (
            <div className="reservation-container">
                <h2>{confirmed ? '예약이 확정되었습니다!' : '대기 중입니다...'}</h2>
                <p>{userId}님, 순서를 기다려주세요.</p>
                {ranking !== null && !confirmed && (
                    <p>현재 대기 순번: <strong>{ranking}번</strong></p>
                )}
                {!confirmed && (
                    <button onClick={cancelUser} className="cancel-button">
                        취소하기
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="reservation-container">
            <h2>대기열 프로젝트</h2>
            <input
                type="text"
                placeholder="숫자 ID를 입력하세요"
                value={userId}
                onChange={handleChange}
                className="reservation-input"
            />
            {showButton && (
                <button onClick={registerUser} className="reservation-button">
                    예약하기
                </button>
            )}
        </div>
    );
};

export default Home;
