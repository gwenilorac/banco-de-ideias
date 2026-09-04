import { Routes } from '@angular/router';
import { CadastroComponent } from '@features/cadastro/cadastro.component';
import { IdeiaComponent } from '@features/ideia/ideia.component';

export const routes: Routes = [
    {
        path:'',
        component: CadastroComponent
    },

    {   
        path: 'ideia/:id', 
        component: IdeiaComponent 
    }

];
