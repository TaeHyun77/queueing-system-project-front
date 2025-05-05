import React, { useState, useEffect } from 'react';
import axios from "axios";
import './Home.css';

const Home = () => {
  const [name, setName] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [ranking, setRanking] = useState(null); // 순위 상태 추가

  const registerUser = async (userId, queueType = 'reserve') => {
    try {
      const response = await axios.post(
        'http://localhost:8080/user/enter',
        null,
        {
          params: {
            user_id: userId,
            queueType: queueType
          }
        }
      );
      console.log("대기열 등록 성공");
    } catch (error) {
        if (error.response && error.response.status === 400) {
          throw new Error("이미 대기열에 등록된 사용자입니다.");
        } else {
          throw new Error("서버 오류가 발생했습니다.");
        }
      }
  };

  const checkUserRanking = async (userId, queueType = 'reserve') => {
    try {
      const response = await axios.get(
        'http://localhost:8080/user/search/ranking',
        {
          params: {
            user_id: userId,
            queueType: queueType
          }
        }
      );

      if (ranking !== response.data) {
        setRanking(response.data);  // 값이 달라질 때만 상태 업데이트
      }

      console.log(`${userId}님의 순위: ${response.data}`);
      setRanking(response.data); 
    } catch (error) {
      console.error('사용자 순위 조회 중 에러:', error);
    }
  };

  const cancelUserWaiting = async (userId, queueType = 'reserve') => {
    try {
      const response = await axios.delete(
        'http://localhost:8080/user/cancel',
        {
          params: {
            user_id: userId,
            queueType: queueType
          }
        }
      );
  
      if (response.status === 200) {
        console.log("취소 성공");
        return true;
      } else {
        console.warn("예상치 못한 응답 코드:", response.status);
        return false;
      }
  
    } catch (error) {
      if (error.response && error.response.status === 400) {
        throw new Error("대기열에 등록되지 않은 사용자입니다.");
      } else {
        throw new Error("서버 오류가 발생했습니다.");
      }
    }
  };
  
  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setName(value);
      setShowButton(value.trim().length > 0);
    }
  };

  const handleReservation = async () => {
    const check = window.confirm("대기열에 참여하시겠습니까 ?");
    if (!check) return;

    try {
      await registerUser(name);
      alert(`${name}님, 대기열 등록이 완료되었습니다!`);
      await checkUserRanking(name); 
      setIsWaiting(true);
    } catch (error) {
      alert('이미 등록된 사용자입니다.');
    }
  };

  const handleCancel = async () => {
    const confirmCancel = window.confirm("정말로 대기열에서 취소하시겠습니까?");
    if (!confirmCancel) return;
  
    try {
      await cancelUserWaiting(name);
      alert(`${name}님, 대기열에서 성공적으로 취소되었습니다.`);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsWaiting(false);
      setName('');
      setRanking(null);
      setShowButton(false);
    }
  };

  useEffect(() => {
    let interval;

    if (isWaiting && name) {
      interval = setInterval(() => {
        checkUserRanking(name); 
      }, 2000); // 5초마다 갱신
    }

    return () => {
      if (interval) clearInterval(interval); // 언마운트 시 정리
    };
  }, [isWaiting, name]);
  

  // 대기 화면
  if (isWaiting) {
    return (
      <div className="reservation-container">
        <h2>대기 중입니다...</h2>
        <p>{name}님, 순서를 기다려주세요.</p>
        {ranking !== null && (
          <p>현재 대기 순번: <strong>{ranking}번</strong></p>
        )}
        <button onClick={handleCancel} className="cancel-button">
          취소하기
        </button>
      </div>
    );
  }

  return (
    <div className="reservation-container">
      <h2>대기열 프로젝트</h2>
      <input
        type="text"
        placeholder="숫자 ID를 입력하세요"
        value={name}
        onChange={handleChange}
        className="reservation-input"
      />
      {showButton && (
        <button onClick={handleReservation} className="reservation-button">
          예약하기
        </button>
      )}
    </div>
  );
};

export default Home;
