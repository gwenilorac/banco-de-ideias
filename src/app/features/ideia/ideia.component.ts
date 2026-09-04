import { Component, DestroyRef, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IdeiaService } from '@core/services/ideia.service';
import { IdeiaInterface } from '@shared/ideia.interface';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-ideia',
  styleUrl: './ideia.component.scss',
  templateUrl: './ideia.component.html',
})
export class IdeiaComponent {
  ideiaService = inject(IdeiaService);

  private router = inject(Router);
  private fb = inject(FormBuilder);

  private destroyRef = inject(DestroyRef);

  id = input.required<string>();

  ideiaForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', Validators.required],
    status: ['pendente']
  })

  constructor() {
    effect(() => {
      const idAtual = this.id();
      if (idAtual) {
        this.carregarIdeia(idAtual);
      }
    })
  }

  carregarIdeia(id: string) {
    this.ideiaService.getIdeiaById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dadosDaIdeia) => {
          this.ideiaForm.patchValue(dadosDaIdeia);
        },
        error: (erro: Error) => {
          console.error('Erro ao carregar a ideia: ', erro.message);
          alert(erro.message);
        }
      });
  }

  salvarAlteracoes() {
    if (this.ideiaForm.valid) {
      const dadosAtualizados = this.ideiaForm.value as Partial<IdeiaInterface>;

      this.ideiaService.atualizarIdeia(this.id(), dadosAtualizados)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            alert('Ideia atualizada com sucesso!')
            this.router.navigate(['/']);
          },

          error: (erro: Error) => {
            console.error('Erro ao salvar a ideia: ', erro.message);
            alert(erro.message)
          }

        })
    } else {
      this.ideiaForm.markAllAsTouched();
    }
  }

  excluirIdeia() {
    const confirmacao = confirm("Tem certeza que deseja excluir essa ideia?")

    if (confirmacao) {
      this.ideiaService.excluirIdeia(this.id())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            alert('Ideia excluida com sucesso!')
            this.router.navigate(['/']);
          },

          error: (erro: Error) => {
            console.error('Erro ao excluir a ideia: ', erro.message);
            alert(erro.message)
          }
        })
    }
  }

}
