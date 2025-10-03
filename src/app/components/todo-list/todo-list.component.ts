import { Component, OnInit } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo-list',
  standalone: true, // ✅ Standalone component
  imports: [CommonModule],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'] // ✅ fixed `styleUrl` → `styleUrls`
})
export class TodoListComponent implements OnInit {
  todos: any[] = [];
  isModalOpen = false;
  selectedTodo: any = null;

  loading: boolean = false; // ✅ Spinner state

  constructor(private todoService: TodoService, private router: Router) {}

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.loading = true; // ✅ Start spinner
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos = data;
        this.loading = false; // ✅ Stop spinner
      },
      error: () => {
        this.loading = false; // ✅ Stop spinner even on error
        alert('Failed to load TODOs');
      }
    });
  }

  viewTodo(id: number) {
    this.router.navigate([`/dashboard/todos/${id}`]);
  }

  addTodo() {
    this.router.navigate(['/dashboard/todos/new']);
  }

  editTodo(id: string) {
    this.router.navigate(['/dashboard/todos/edit', id]);
  }

  deleteTodo(id: string) {
    if (confirm('Are you sure you want to delete this TODO?')) {
      this.loading = true; // ✅ Show spinner while deleting
      this.todoService.deleteTodo(id).subscribe({
        next: () => {
          this.loadTodos(); // ✅ Refresh list
        },
        error: () => {
          this.loading = false;
          alert('Failed to delete TODO');
        }
      });
    }
  }

  // Modal methods
  openViewModal(todo: any) {
    this.selectedTodo = todo;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedTodo = null;
  }
}
