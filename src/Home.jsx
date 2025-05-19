import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clock from './clock.png';
import './Home.css';

const serverURL = 'http://localhost:8080';

const Home = () => {
    const [userId, setUserId] = useState('');
    const [showButton, setShowButton] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [ranking, setRanking] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        const value = e.target.value;
        setUserId(value);
        setShowButton(value.trim().length > 0);
    };

    const registerUser = async () => {
        const confirm = window.confirm("대기열에서 참여하시겠습니까 ?");
        if (!confirm) return;

        try {
            const res = await fetch(`${serverURL}/user/enter?user_id=${userId}&queueType=reserve`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error("이미 대기 중이거나 예약이 진행 중인 사용자입니다");
            alert(`${userId}님, 대기열 등록 완료!`);
            setIsWaiting(true);
            localStorage.setItem("user_id", userId); // 저장
            localStorage.setItem("is_waiting", "true");
        } catch (err) {
            alert(err.message);
        }
    };

    const cancelUser = async () => {
        const confirm = window.confirm("대기열에서 취소하시겠습니까?");
        if (!confirm) return;

        try {
            const res = await fetch(`${serverURL}/user/cancel?user_id=${userId}&queueType=reserve&queueCategory=wait`, {
                method: 'DELETE',
            });

            if (res.ok) {
                console.log(userId + "님 대기열 삭제 완료")
                alert("대기열 취소 완료!");
                setIsWaiting(false);
                setUserId('');
                setRanking(null);
                setShowButton(false);
                setConfirmed(false);
                localStorage.clear(); // 초기화
            } else {
                throw new Error("취소 실패");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        const savedId = localStorage.getItem("user_id");
        const waiting = localStorage.getItem("is_waiting") === "true";
        if (savedId && waiting) {
            setUserId(savedId);
            setIsWaiting(true);
        }
    }, []);

    useEffect(() => {
        if (!isWaiting || !userId) return;

        const sse = new EventSource(`${serverURL}/queue/stream?userId=${userId}&queueType=reserve`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event === 'update') {
                    setRanking(data.rank);
                } else if (data.event === 'confirmed') {
                    
                    localStorage.removeItem("is_waiting"); // 확정되면 대기 상태 해제
                    console.log("예약 페이지 이동")

                    fetch(`${serverURL}/user/createCookie?queueType=reserve&user_id=${userId}`, {
                        method: 'GET',
                        credentials: 'include'
                    })
                        .then(response => {
                            if (!response.ok) throw new Error("쿠키 발급 실패");
                            setConfirmed(true);
                            navigate('/target-page');
                            sse.close();
                        })
                        .catch(error => {
                            console.error("토큰 발급 중 오류:", error);
                            alert("서버 오류로 이동할 수 없습니다.");
                        });
                }
            } catch (e) {
                console.warn('SSE 데이터 파싱 실패:', event.data);
            }
        };

        sse.onopen = () => console.log("SSE 연결 성공!");
        sse.onerror = (err) => {
            console.error('SSE 연결 오류:', err);
            sse.close();
        };

        return () => sse.close();
    }, [isWaiting, userId]);

    // 대기열에서 새로고침 시 맨 뒤로 밀리게 처리
    useEffect(() => {
        if (!isWaiting || !userId) return;

        const handleBeforeUnload = () => {
            navigator.sendBeacon(
                `${serverURL}/user/reEnter?user_id=${userId}&queueType=reserve`
            );
            console.log("새로고침으로 인한 대기열 후순위 재배치");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isWaiting, userId]);

    if (isWaiting) {
        return (
            <div className="reservation-container">
                <div>
                    <img src={clock} alt="모래시계" style={{ width: '100px', height: '100px' }} />
                </div>
                <h2>{confirmed ? '예약이 확정되었습니다!' : '서비스 접속 대기 중입니다...'}</h2>
                <p>{userId}님, 순서를 기다려주세요.</p>
                <p>잠시만 기다리시면 서비스에 자동 접속됩니다.</p>
                <h4>새로고침하면 대기 순번이 가장 뒤로 이동합니다.</h4>
                {ranking !== null && !confirmed && (
                    <h3 style={{ marginTop: "30px" }}>현재 대기 순번: <strong>{ranking}번</strong></h3>
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
                placeholder="예약명을 입력해주세요"
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