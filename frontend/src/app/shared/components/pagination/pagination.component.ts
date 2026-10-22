import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-wrapper" *ngIf="totalCount > 0">
      <div class="pagination-info">
        Hiển thị <strong>{{ startItem }}</strong> - <strong>{{ endItem }}</strong> trong tổng số <strong>{{ totalCount }}</strong> bản ghi
      </div>

      <div class="pagination-controls">
        <div class="page-size-selector">
          <label for="pageSizeSelect">Mỗi trang:</label>
          <select id="pageSizeSelect" [value]="pageSize" (change)="onPageSizeChange($event)">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="20">20</option>
            <option [value]="50">50</option>
          </select>
        </div>

        <div class="page-buttons">
          <button class="btn-page" 
                  [disabled]="currentPage <= 1" 
                  (click)="changePage(currentPage - 1)" 
                  title="Trang trước">
            ‹
          </button>

          <ng-container *ngFor="let page of visiblePages">
            <button *ngIf="page !== -1" 
                    class="btn-page" 
                    [class.active]="page === currentPage" 
                    (click)="changePage(page)">
              {{ page }}
            </button>
            <span *ngIf="page === -1" class="page-ellipsis">…</span>
          </ng-container>

          <button class="btn-page" 
                  [disabled]="currentPage >= totalPages" 
                  (click)="changePage(currentPage + 1)" 
                  title="Trang sau">
            ›
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-wrapper {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      font-size: 0.875rem;
      color: #4b5563;
    }
    .pagination-info strong {
      color: #111827;
      font-weight: 600;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-size-selector select {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #ffffff;
      color: #374151;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .page-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-page {
      min-width: 34px;
      height: 34px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      color: #374151;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-page:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    .btn-page.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
      font-weight: 600;
    }
    .btn-page:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .page-ellipsis {
      padding: 0 4px;
      color: #9ca3af;
    }
  `]
})
export class PaginationComponent {
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalCount / (this.pageSize || 1)) || 1;
  }

  get startItem(): number {
    if (this.totalCount === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, -1, total];
    }
    if (current >= total - 3) {
      return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, -1, current - 1, current, current + 1, -1, total];
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageSizeChange.emit(newSize);
  }
}
