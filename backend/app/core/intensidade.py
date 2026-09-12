
'''
    # Intensidade
    'threshold': 
    'log': 
    'potencia': 
    'equalizar': 
    'fat-intensidade': 
'''

import cv2
import numpy as np

from backend.app.core.filters_geral import gray_scale_img

def threshold(img, p1=None, p2=None, p3=None):
    try:
        # Recebe o valor de corte
        k = int(p1)

        # Verifica se a imagem é em escala de cinza (se não converte)
        gray_img = img if img.shape == 2 else gray_scale_img(img)

        # Aplica a transformação
        _, result = cv2.threshold(gray_img, k, 255, cv2.THRESH_BINARY)

        return result

    except Exception as e:
        print('Erro ao aplicar o filtro de intensidade à imagem', e)
        return img


def log(img, p1=None, p2=None, p3=None):
    '''
    O calculo da transformação do log é img = c * log(1 + r)
    Sendo c uma constante qualquer e r são os pixels analisados
    '''
    c = float(p1)
    is_color = len(img.shape) == 3

    if is_color:
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, target = cv2.split(hsv_img)
    else:
        target = img.copy()

    img_float = target.astype(np.float32) / 255.0
    log_img = np.log1p(img_float)

    max_value = np.max(log_img)
    if max_value > 0:
        log_img /= max_value # Normaliza para valores entre 0 e 1

    result_channel = np.uint8(np.clip(c * log_img, 0, 1) * 255) # Volta novamente para valores entre 0 e 255

    if is_color:
        hsv_img = cv2.merge([h, s, result_channel])
        result = cv2.cvtColor(hsv_img, cv2.COLOR_HSV2BGR)

        return result
    else:
        return result

def potencia(img, p1=None, p2=None, p3=None):
    '''
    O calculo da transformação do log é img = c * r^gamma
    Sendo c uma constante qualquer e r são os pixels analisados
    '''

    gamma = float(p1)
    is_color = len(img.shape) == 3

    if is_color:
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, target = cv2.split(hsv_img)
    else:
        target = img.copy()

    img_float = target.astype(np.float32) / 255.0
    result_channel = np.power(img_float, gamma)
    result_channel = np.uint8(np.clip(result_channel, 0, 1)* 255)

    if is_color:
        hsv_img = cv2.merge([h, s, result_channel])
        result = cv2.cvtColor(hsv_img, cv2.COLOR_HSV2BGR)

        return result
    else:
        return result

def equalizar(img, p1=None, p2=None, p3=None):
    is_color = len(img.shape) == 3

    if is_color:
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, target = cv2.split(hsv_img)
    else:
        target = img.copy()

    result_channel = cv2.equalizeHist(target)

    if is_color:
        hsv_img = cv2.merge([h, s, result_channel])
        result = cv2.cvtColor(hsv_img, cv2.COLOR_HSV2BGR)

        return result
    else:
        return result

def fat_intensidade(img, p1=None, p2=None, p3=None):
    lower = int(p1)
    upper = int(p2)
    preservar_bg = str(p3).strip().lower() == 'true'

    gray_img = img if len(img.shape) == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Cria um intervalo do valor lower até o valor upper
    mask = (gray_img >= lower) & (gray_img <= upper)

    # Se preservar fundo estiver true então as partes que deveriam ser pretas
    # ficam com a mesma intensidade do fundo
    if preservar_bg:
        result = img.copy()
        result[mask] = 255
    else:
        result = np.where(mask, 255, 0).astype(np.uint8)


    return result
