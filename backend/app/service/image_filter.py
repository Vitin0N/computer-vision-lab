import cv2
import numpy as np

from backend.app.core.filters_geral import (
    gray_scale_img, negative_img
)

from backend.app.core.intensidade import (
    threshold, log, potencia, equalizar, fat_intensidade
)

from backend.app.core.espaco import (
    gaussian_blur, media_blur, dilate, erode, mediana_blur
)

from backend.app.core.bordas import (
    bordas_sobel, agucamento, bordas_laplace, bordas_canny
)

FILTER_DISPATCH = {
    # Geral
    'negativo': negative_img,
    'cinza': gray_scale_img,

    # Intensidade
    'threshold': threshold,
    'log': log,
    'potencia': potencia,
    'equalizar':equalizar,
    'fat-intensidade': fat_intensidade,

    # Espaciais
    'blur-gaussiano': gaussian_blur,
    'media': media_blur, 
    'mediana': mediana_blur,
    'max': dilate,
    'min': erode, 

    # Detecção de Bordas / Realce
    'bordas-sobel': bordas_sobel,
    'bordas-laplace': bordas_laplace,
    'bordas-canny': bordas_canny,
    'agucamento': agucamento,
}

def apply_filter(img, operation, p1=None, p2=None, p3=None):
    '''Identifica a imagem que esta sendo processada e qual filtro aplicar'''
    if img is None:
        return None

    if operation not in FILTER_DISPATCH.keys():
        print(f'Operação não reconhecida: {operation}')
        return img

    try:
        return FILTER_DISPATCH[operation](img, p1, p2, p3)
    except Exception as e:
        print(f'Erro inesperado ao processar "{operation}": {e}')
