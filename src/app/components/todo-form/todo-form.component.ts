import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TodoService } from '../../services/todo.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-form.component.html',
  styleUrls: ['./todo-form.component.css']
})
export class TodoFormComponent implements OnInit {

  todoForm: FormGroup;
  todoId: string | null = null;  // stores ID if editing
  showErrorToast: boolean = false; // for toast message
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // initialize form
    this.todoForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      isCompleted: [true]
    });
  }

  ngOnInit(): void {
    // Check if route has id
    this.todoId = this.route.snapshot.paramMap.get('id');
    if (this.todoId) {
      this.loadTodo(this.todoId);
    }
  }

  // Load TODO data in edit mode
  loadTodo(id: string) {
    this.todoService.getTodo(id).subscribe({
      next: (data) => {
        this.todoForm.patchValue({
          title: data.title,
          description: data.description,
          isCompleted: data.isCompleted
        });
      },
      error: () => this.showToast('Failed to load TODO')
    });
  }

  // Show toast message
  showToast(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;

    // Hide after 3 seconds
    setTimeout(() => {
      this.showErrorToast = false;
    }, 3000);
  }

  // Form submit
  onSubmit() {
    // If form is invalid, mark fields touched and show error
    if (this.todoForm.invalid) {
      this.todoForm.markAllAsTouched();
      this.showToast('Please fill all required fields');
      return;
    }

    if (this.todoId) {
      // Edit mode
      this.todoService.updateTodo(this.todoId, this.todoForm.value).subscribe({
        next: () => {
          alert('TODO updated successfully');
          this.router.navigate(['/dashboard/todos']);
        },
        error: () => this.showToast('Failed to update TODO')
      });
    } else {
      // Add mode
      this.todoService.addTodo(this.todoForm.value).subscribe({
        next: () => {
          alert('TODO added successfully');
          this.router.navigate(['/dashboard/todos']);
        },
        error: () => this.showToast('Failed to add TODO')
      });
    }
  }
}
