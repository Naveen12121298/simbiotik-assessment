import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo-detail.component.html',
  styleUrl: './todo-detail.component.css'
})

export class TodoDetailComponent implements OnInit {
  todo: any;

  constructor(private route: ActivatedRoute, private todoService: TodoService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id,'id');

    this.todoService.getTodo(id).subscribe({
      next: (data) => this.todo = data,
      error: () => alert('Failed to fetch details')
    });
  }
}

