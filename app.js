const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initalizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (e) {
    console.log(`Error at Database ${e.message}`)
    process.exit(1)
  }
}

initalizeDBAndServer()

//API 1
//status property

const hasStatusProperty = (statProp) => {
  return statProp.status !== undefined
}

//priority property

const hasPrioProp = (prioProp) => {
  return prioProp.priority !== undefined
}

//status priority

const hasStatPrio = (statPrio) => {
  return (statPrio.status !== undefined && statPrio.priority !== undefined);
}

//search_q

const hasSearch = (search) => {
  return search.search_q !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = ''
  let query = ''
  const {status, priority, search_q = ' '} = request.query
  switch (true) {
    case hasStatusProperty(request.query):
      query = `
              SELECT * FROM todo 
              WHERE status = '${status}' and todo LIKE '%${search_q}%' ; 
           `
      break

    case hasPrioProp(request.query):
      query = `
            SELECT * FROM todo 
            WHERE priority = '${priority}' and todo LIKE '%${search_q}%' ;
        `
      break

    case hasStatPrio(request.query):
      query = `
             SELECT * FROM todo 
             WHERE status = '${status}' and priority = '${priority}' and todo LIKE '%${search_q}%';
        `
      break

    case hasSearch(request.query):
      query = `
             SELECT * FROM todo
             WHERE todo LIKE '%${search_q}%';
        `
      break

    default:
      response.send('Default Value')
      break
  }
  data = await db.all(query)
  response.send(data)
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `
       SELECT * FROM todo
       WHERE id = ${todoId};
    `
  const getQueryResponse = await db.get(getQuery)
  response.send(getQueryResponse)
})

//API 3

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postQuery = `
     INSERT INTO todo(id, todo, priority, status) 
     VALUES (${id}, '${todo}', '${priority}', '${status}');
  `
  const postQueryResponse = await db.run(postQuery)
  response.send('Todo Successfully Added')
})

//API 4

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateBody = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateBody = 'Status'
      break

    case requestBody.priority !== undefined:
      updateBody = 'Priority'
      break

    case requestBody.todo !== undefined:
      updateBody = 'Todo'
      break
  }
  const previousTodoQuery = `
  select * from todo
  where id = ${todoId}`
  const previoustodo = await db.get(previousTodoQuery)

  const {
    todo = previoustodo.todo,
    priority = previoustodo.priority,
    status = previoustodo.status,
  } = request.body

  const updateQuery = `
  update todo set
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  where 
  id = ${todoId}`
  await db.run(updateQuery)
  response.send(`${updateBody} Updated`)
})

//API 5

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
   DELETE FROM todo WHERE id = ${todoId};
  `
  const deleteQueryResponse = await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
