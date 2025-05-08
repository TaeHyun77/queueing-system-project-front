import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie';
import './TargetPage.css'

const TargetPage = () => {
    const navigate = useNavigate()
    const [secondsLeft, setSecondsLeft] = useState(600) // 10분

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
    }
    
    useEffect(() => {
        const expireTime = localStorage.getItem('expireTime')
        const user_id = localStorage.getItem('user_id')

        if (!expireTime) {
            localStorage.removeItem('expireTime')
            const newExpire = Date.now() + 100_000
            localStorage.setItem('expireTime', newExpire.toString())
        }

        const interval = setInterval(() => {
            const current = Date.now()
            const expire = parseInt(localStorage.getItem('expireTime') || '0', 10)
            const diff = Math.floor((expire - current) / 1000)

            if (diff <= 0) {
                clearInterval(interval)
                localStorage.removeItem('expireTime')
                Cookies.remove(`reserve_user-access-cookie_${user_id}`)
                navigate('/')
            } else {
                setSecondsLeft(diff)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [navigate])

    useEffect(() => {
        const verifyToken = async () => {

            const user_id = localStorage.getItem('user_id')
            const token = Cookies.get(`reserve_user-access-cookie_${user_id}`)
            console.log(token)

            if (!token || !user_id) {
                alert("인증되지 않은 사용자입니다.");
                navigate('/')
                return
            }
                  
            try {
                const res = await fetch(
                    `http://localhost:8080/user/isValidateToken?user_id=${user_id}&queueType=reserve&token=${token}`
                )

                if (!res.ok) {
                    console.error('검증 실패 : ', res.status)
                    navigate('/')
                    return
                }

                const isValid = await res.json()
                if (!isValid) {
                    navigate('/')
                } else {
                    console.log("인증된 사용자입니다.")
                }

            } catch (error) {
                console.error('토큰 검증 실패 : ', error)
                navigate('/')
            }
        }

        verifyToken()
    }, [navigate])

    const handleCancelReserve = () => {
        const user_id = localStorage.getItem('user_id')
        
        const confirm = window.confirm("예약을 포기하시겠습니까 ?")
        if (!confirm) return

        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`reserve_user-access-cookie_${user_id}`)
        navigate('/')
    }

    return (
        <div className="target-container">
            <div className="target-box">
                <h1 className="target-title">예약 진행 페이지입니다!</h1>
                <p className="target-text">예약을 진행해주세요 !</p>
                <p className="target-timer">
                    남은 시간: {minutes}분 {seconds < 10 ? `0${seconds}` : seconds}초
                </p>
                <button onClick={handleCancelReserve} className="back-button">
                    뒤로 가기
                </button>
            </div>
        </div>
    )
}

export default TargetPage
