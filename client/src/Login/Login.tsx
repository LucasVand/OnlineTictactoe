import { useEffect, useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
import { socket } from '../App'

function Login() {

    const [name, setName] = useState('')
    const [success, setSucess] = useState('pending')
    const [errorMessage, setErrorMessage] = useState(' ')
    const navigate = useNavigate()

    const login = () => {
        if (name != '') {

            socket.emit("player_registered", name)

        } else {
            setErrorMessage("Your name cannot be blank")
        }
    }

    useEffect(() => {
        socket.on('successful_login', (data) => {
            setSucess(data.condition)
            if (data.condition == 'success') {
                navigate('/menu', { replace: true, state: { user: data.name } })
            } else if (data.condition == "alreadyOnline") {
                setErrorMessage("This user is already logged in")
            }
        })
    }, [socket, success, name])

    return (
        <>
            <div className='loginCont'>
                <div className='namePrompt'>Enter Your Name</div>
                <input className='nameInput' placeholder='Name' onChange={(e) => {
                    setName(e.target.value)
                    setErrorMessage('')
                }}

                    defaultValue={name} />
                <div className='loginErrorMessage'>{errorMessage}</div>
                <div>
                    <button className='submitNameButton' onClick={login}>Submit</button>
                </div>

            </div>
        </>
    )
}

export default Login