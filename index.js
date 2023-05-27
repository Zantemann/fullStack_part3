const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
require('dotenv').config()

const Person = require('./models/person')

morgan.token('body', (req, res) => JSON.stringify(req.body))

app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(express.static('build'))

let persons = [
]

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    }
  
    next(error)
}
  

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    }).catch(error => {
        console.log('Error retrieving persons:', error)
        response.status(500).json({ error: 'Error retrieving persons' })
    })
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    }) 
})

app.get('/info', (request, response) => {
    const count = persons.length
    const time = new Date().toLocaleString()
    const responseHtml = 
    `<div>
        <p>Phonebook has info for ${count} people</p>
        <p>${time}</p>            
    </div>`
    response.send(responseHtml)
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id;
    console.log('Deleting person with id:', id);
    Person.findByIdAndRemove(request.params.id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next)
})

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({ 
            error: 'name missing' 
        })
    } else if (!body.number){
        return response.status(400).json({ 
            error: 'number missing' 
        })
    } else if (persons.some(person => person.name === body.name)){
        return response.status(400).json({ 
            error: 'name must be unique'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save().then(savedPerson => {
        response.json(person)
    })
})

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})