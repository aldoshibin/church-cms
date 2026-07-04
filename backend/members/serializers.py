from rest_framework import serializers
from .models import Member, Family, Ministry


class MinistryMemberMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = Member
        fields = ['id', 'full_name', 'first_name', 'last_name', 'status']


class MinistrySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    leader_name  = serializers.SerializerMethodField()
    members      = MinistryMemberMiniSerializer(many=True, read_only=True)

    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model  = Ministry
        fields = [
            'id', 'name', 'description', 'leader', 'leader_name',
            'meeting_day', 'meeting_time', 'is_active',
            'member_count', 'members', 'member_ids',
        ]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_leader_name(self, obj):
        return obj.leader.full_name if obj.leader else None

    def _assign_members(self, ministry, member_ids):
        if member_ids is None:
            return
        members_qs = Member.objects.filter(id__in=member_ids)
        ministry.members.set(members_qs)

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        ministry = super().create(validated_data)
        self._assign_members(ministry, member_ids)
        return ministry

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        ministry = super().update(instance, validated_data)
        if member_ids is not None:
            self._assign_members(ministry, member_ids)
        return ministry


class MemberListSerializer(serializers.ModelSerializer):
    full_name      = serializers.ReadOnlyField()
    family_name    = serializers.SerializerMethodField()
    family_id_code = serializers.SerializerMethodField()

    class Meta:
        model  = Member
        fields = [
            'id', 'member_id', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'status', 'family', 'family_name',
            'family_id_code', 'membership_date', 'profile_picture',
        ]

    def get_family_name(self, obj):
        return obj.family.name if obj.family else None

    def get_family_id_code(self, obj):
        return obj.family.family_id if obj.family else None


class MemberDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import MemberDocument
        model  = MemberDocument
        fields = ['id', 'doc_type', 'title', 'file', 'uploaded_at']


class MemberDetailSerializer(serializers.ModelSerializer):
    full_name   = serializers.ReadOnlyField()
    ministries  = MinistrySerializer(source='ministry_groups', many=True, read_only=True)
    family_name = serializers.SerializerMethodField()
    documents   = MemberDocumentSerializer(many=True, read_only=True)

    class Meta:
        model  = Member
        fields = '__all__'
        extra_kwargs = {
            'family':     {'required': False, 'allow_null': True},
            'member_id':  {'read_only': True},  # always auto-generated, never user-editable
        }

    def get_family_name(self, obj):
        return obj.family.name if obj.family else None


class FamilySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    members      = MemberListSerializer(many=True, read_only=True)

    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model  = Family
        fields = ['id', 'family_id', 'name', 'head_of_family', 'address', 'city', 'state',
                  'zip_code', 'phone', 'member_count', 'members', 'member_ids', 'created_at']
        read_only_fields = ['family_id']

    def get_member_count(self, obj):
        return obj.members.count()

    def _assign_members(self, family, member_ids):
        Member.objects.filter(family=family).exclude(id__in=member_ids).update(family=None)
        if member_ids:
            Member.objects.filter(id__in=member_ids).update(family=family)

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        family = super().create(validated_data)
        self._assign_members(family, member_ids)
        return family

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        family = super().update(instance, validated_data)
        if member_ids is not None:
            self._assign_members(family, member_ids)
        return family
