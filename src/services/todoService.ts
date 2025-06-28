import axiosInstance from '@/lib/axiosInstance'

export interface Todo {
  _id?: string
  title: string
  description: string
  priority?: string
  work?: string
}



export const todoService = {
    createTodo: async (todo: Todo) => {
        const res = await axiosInstance.post('/todos/create', todo)
        return res.data
    },
    
    getTodos: async () => {
        const res = await axiosInstance.get('/todos')
        return res.data
    },
    
    getTodoById: async (id: string) => {
        console.log('id,,,,,,',id)
        const res = await axiosInstance.get(`/todos/${id}`)
        return res.data
    },
    updateTodo: async (id: string, updatedFields: Partial<Todo>) => {
        const res = await axiosInstance.put(`/todos/${id}`, updatedFields)
        return res.data
    },
    deleteTodo: async (id: string) => {
        const res = await axiosInstance.delete(`/todos/${id}`)
        return res.data
    }
}
