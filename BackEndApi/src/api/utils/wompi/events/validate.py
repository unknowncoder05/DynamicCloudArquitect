import hashlib


def get_checksum(validated_data, event_secret):
    s = ''
    for property in validated_data['signature']['properties']:
        if property == 'transaction.id':
            s += str(validated_data['data']['transaction']['id'])
        elif property == 'transaction.status':
            s += str(validated_data['data']['transaction']['status'])
        elif property == 'transaction.amount_in_cents':
            s += str(validated_data['data']['transaction']['amount_in_cents'])

    s += validated_data['timestamp']
    s += event_secret
    expected_checksum = hashlib.sha256(s.encode('utf-8')).hexdigest()
    return expected_checksum


def validate_checksum(validated_data, event_secret):
    expected_checksum = get_checksum(validated_data, event_secret)
    if expected_checksum == validated_data['signature']['checksum']:
        return True
