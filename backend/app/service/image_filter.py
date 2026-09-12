import cv2
import numpy as np

from backend.app.core.filters_geral import (
    gray_scale_img, negative_img
)

FILTER_DISPATCH = {
    # Geral
    'negativo': negative_img,
    'cinza': gray_scale_img,

    # Intensidade
    'threshold': ...,#_apply_threshold,
    'log': ...,#_apply_log,
    'potencia': ...,#_apply_power,
    'equalizar': ...,##_apply_equalize,
    'fat-intensidade': ...,#_apply_intensity_slicing,

    # Espaciais
    'blur-gaussiano': ...,#_apply_gaussian,
    'media': ...,#_apply_mean,
    'mediana': ...,#_apply_median,
    'max': ...,#_apply_max,
    'min': ...,#_apply_min,

    # Detecção de Bordas / Realce
    'bordas-sobel': ...,#_apply_sobel,
    'bordas-laplace': ...,#_apply_laplace,
    'bordas-canny': ...,#_apply_canny,
    'agucamento':... #_apply_sharpening,
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
