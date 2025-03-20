import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import axios from 'axios'
import { Header } from '../components/Header'
import { url } from '../const'
import './home.scss'

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo') // todo->未完了 done->完了
  const [lists, setLists] = useState([])
  const [selectListId, setSelectListId] = useState()
  const [tasks, setTasks] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [cookies] = useCookies()
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value)
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data)
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`)
      })
  }, [cookies.token])

  useEffect(() => {
    const listId = lists[0]?.id
    if (typeof listId !== 'undefined') {
      setSelectListId(listId)
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks)
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`)
        })
    }
  }, [cookies.token, lists])

  const handleSelectList = (id) => {
    setSelectListId(id)
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks)
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`)
      })
  }

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>

          <div className="list-tab" role="tablist">
            {lists.map((list) => {
              const isActive = list.id === selectListId
              return (
                <button
                  key={list.id}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  role="tab"
                  aria-selected={list.id === selectListId}
                  tabIndex="0"
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectList(list.id)
                    }
                  }}
                >
                  {list.title}
                </button>
              )
            })}
          </div>

          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

const getRemainingTime = (limit) => {
  const totalLimits = Date.parse(limit) - Date.now()

  if (totalLimits < 0) {
    return null
  }

  return {
    days: Math.floor(totalLimits / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalLimits % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((totalLimits % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((totalLimits % (1000 * 60)) / 1000),
  }
}

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props
  if (tasks === null) return <></>

  if (isDoneDisplay === 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true
          })
          .map((task, key) => {
            const remainingTime = getRemainingTime(task.limit)
            return (
              <li key={key} className="task-item">
                <Link
                  to={`/lists/${selectListId}/tasks/${task.id}`}
                  className="task-item-link"
                >
                  {task.title}
                  期限：
                  {task.limit
                    ? new Date(task.limit).toLocaleDateString('ja-JP')
                    : 'なし'}
                  {remainingTime && (
                    <>
                      （残り：
                      {remainingTime.days}日 {remainingTime.hours}時間{' '}
                      {remainingTime.minutes}分 {remainingTime.seconds}秒）
                    </>
                  )}
                  {!remainingTime && <> 期限切れ</>}
                  <br />
                  {task.done ? '完了' : '未完了'}
                </Link>
              </li>
            )
          })}
      </ul>
    )
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false
        })
        .map((task, key) => {
          const remainingTime = getRemainingTime(task.limit)
          return (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                期限：
                {task.limit
                  ? new Date(task.limit).toLocaleDateString('ja-JP')
                  : 'なし'}
                {remainingTime && (
                  <>
                    （残り：
                    {remainingTime.days}日 {remainingTime.hours}時間{' '}
                    {remainingTime.minutes}分 {remainingTime.seconds}秒）
                  </>
                )}
                {!remainingTime && <> 期限切れ</>}
                <br />
                {task.done ? '完了' : '未完了'}
              </Link>
            </li>
          )
        })}
    </ul>
  )
}
