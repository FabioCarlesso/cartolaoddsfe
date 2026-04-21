export interface JogoFavorito {
  timeFavorito: string;
  oddFavorito: number;
  timeAdversario: string;
  oddAdversario: number;
  oddEmpate?: number;
  favoritoEmCasa: boolean;
}

export interface JogoDescartado {
  timeCasa: string;
  timeVisitante: string;
  motivo: string;
}

export interface FavoritosResponse {
  favoritos: JogoFavorito[];
  descartados: JogoDescartado[];
  oddLimiteUtilizado: number;
}
