# Zelar — Localização por zonas (contrato de integração)

## Estado atual
A vista `planta3d.html` é uma demonstração, com nove pontos ilustrativos dentro de quatro divisões. O símbolo move-se suavemente quando o utilizador escolhe uma zona ou executa a simulação automática.

As coordenadas atuais são apenas posições no modelo 3D do Zelar, **não são coordenadas recebidas do FP2**. O modelo físico, a correspondência entre sensores e zonas, a deteção de vários alvos e a integração Aqara estão pendentes.

## Normalização pretendida para os eventos

O serviço cloud deverá normalizar os dados que **efetivamente conseguir obter** dos equipamentos, por exemplo:

```json
{
  "event_id": "uuid-unico",
  "home_id": "casa_001",
  "device_id": "aqara_fp2_sala",
  "timestamp": "2026-11-04T14:30:00Z",
  "type": "zone_presence",
  "room_id": 1,
  "zone_id": "sofa",
  "occupied": true,
  "source": "aqara",
  "confidence": "zone_only"
}
```

Este JSON é um **formato interno Zelar proposto**, não o payload de qualquer API oficial Aqara.

## Regras previstas
- Se recebermos apenas ocupação por zona, apresentar o centro aproximado dessa zona na planta 3D e assinalar “posição estimada por zona”.
- Não inferir identidade pessoal apenas por presença, especialmente quando há visitantes.
- Quando houver vários alvos ou estados contraditórios, apresentar posição indeterminada ou múltiplas presenças não identificadas.
- Não continuar um contador indefinidamente quando a ligação ao dispositivo ficar indisponível; suspender estimativas e assinalar dados desatualizados.
- Deduplicar eventos, respeitar carimbos temporais, evitar mudanças rápidas por ruído e manter histórico de eventos bruto e normalizado.
- Só usar coordenadas reais se forem documentadas, autorizadas e comprovadamente acessíveis no método de integração escolhido.
- A deteção de quedas é uma funcionalidade separada e ainda não validada; nunca tratar um movimento no mapa como confirmação de segurança.

## Próximos passos
1. Confirmar capacidades disponibilizadas pela Aqara Cloud API / Matter e FP2.
2. Implementar ligação segura cloud e permissões por habitação.
3. Validar comportamento com FP2 e Hub M3 físicos.
4. Ligar stream autenticado aos painéis 2D/3D e persistir histórico no servidor.
