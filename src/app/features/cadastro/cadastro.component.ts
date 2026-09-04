import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { IdeiaService } from '@core/services/ideia.service';
import { CardComponent } from '@shared/card/card.component';
import { IdeiaInterface } from '@shared/ideia.interface';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule, CardComponent],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})

export class CadastroComponent implements OnInit {
  nomeDoForm = 'Cadastro de Ideias';
  listaDeIdeias = signal<IdeiaInterface[]>([]);
  ideiaService = inject(IdeiaService);

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.ideiaService.getIdeias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value: IdeiaInterface[]) => {
          this.listaDeIdeias.set(value);
        },
        error: (erro: Error) => {
          console.error('Não foi possível carregar as ideias:', erro.message);
        }
      })
  }

  enviar(form: NgForm) {
    if (form.valid) {
      const novaIdeia = form.value;

      this.ideiaService.saveIdeia(novaIdeia)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (ideiaSalva) => {
            this.listaDeIdeias.update((ideiasAtuais) => [...ideiasAtuais, ideiaSalva]);
            form.resetForm();
          },
          error: (erro: Error) => {
            console.error('Não foi possível salvar a ideia:', erro.message);
          }
        });
    }
  }

}
