import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { Autoria, FILTROS_PADRAO, FiltrosBusca, Ordenacao } from '@shared/ideia.interface';

@Component({
  selector: 'app-ideia-filtros',
  imports: [ReactiveFormsModule],
  templateUrl: './ideia-filtros.component.html',
  styleUrl: './ideia-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeiaFiltrosComponent {
  readonly categorias = input.required<readonly string[]>();

  protected readonly formulario = new FormGroup({
    texto: new FormControl(FILTROS_PADRAO.texto, { nonNullable: true }),
    categoria: new FormControl(FILTROS_PADRAO.categoria, { nonNullable: true }),
    autoria: new FormControl<Autoria>(FILTROS_PADRAO.autoria, { nonNullable: true }),
    ordem: new FormControl<Ordenacao>(FILTROS_PADRAO.ordem, { nonNullable: true }),
  });

  readonly filtrosAlterados = outputFromObservable(
    this.formulario.valueChanges.pipe(map((): FiltrosBusca => this.formulario.getRawValue())),
  );

  protected limpar(): void {
    this.formulario.reset();
  }
}
