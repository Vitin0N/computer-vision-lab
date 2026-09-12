def parse_param(value, param_type='float'):
    '''Converte os parametros vindo do frontend para tipos nativos do python'''

    if value is None or value == 'null' or value == '':
        return None

    try:
        if param_type == 'int':
            return int(float(value))
        elif param_type == 'float':
            return float(value)
        elif param_type == 'bool':
            return bool(value)
    except:
        return None

    return value